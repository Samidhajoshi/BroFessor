package com.skillify.service;

import com.skillify.chat.service.ChatService;
import com.skillify.dto.AcceptRequestDTO;
import com.skillify.dto.SendRequestDTO;
import com.skillify.dto.SkillRequestDTO;
import com.skillify.entity.*;
import com.skillify.util.MeetingLinkValidator;
import com.skillify.exception.ApiException;
import com.skillify.repository.SessionRepository;
import com.skillify.repository.SkillRequestRepository;
import com.skillify.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class SkillRequestService {

    private final SkillRequestRepository requestRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ChatService chatService;
    private final MeetingLinkValidator meetingLinkValidator;

    public SkillRequestService(SkillRequestRepository requestRepository,
                                MeetingLinkValidator meetingLinkValidator,
                                SessionRepository sessionRepository,
                                UserRepository userRepository,
                                NotificationService notificationService,
                                @Lazy ChatService chatService) {
        this.meetingLinkValidator   = meetingLinkValidator;
        this.requestRepository   = requestRepository;
        this.sessionRepository   = sessionRepository;
        this.userRepository      = userRepository;
        this.notificationService = notificationService;
        this.chatService         = chatService;
    }

    @Transactional(readOnly = true)
    public List<SkillRequestDTO> getIncoming(User currentUser) {
        return requestRepository.findByReceiverIdOrderByIdDesc(currentUser.getId())
                .stream().map(SkillRequestDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<SkillRequestDTO> getSent(User currentUser) {
        return requestRepository.findBySenderIdOrderByIdDesc(currentUser.getId())
                .stream().map(SkillRequestDTO::from).toList();
    }

    @Transactional
    public SkillRequestDTO send(User currentUser, SendRequestDTO req) {
        if (req.getReceiverId().equals(currentUser.getId())) {
            throw new ApiException("You cannot send a request to yourself.", HttpStatus.BAD_REQUEST);
        }

        User receiver = userRepository.findById(req.getReceiverId())
                .orElseThrow(() -> new ApiException("User not found.", HttpStatus.NOT_FOUND));

        boolean oneWay = currentUser.getUserType() == UserType.LEARNER;

        if (oneWay && currentUser.getPoints() < 25) {
            throw new ApiException(
                    "Not enough points. You need 25 points to send a one-way learning request.",
                    HttpStatus.BAD_REQUEST);
        }

        // ── Skill compatibility check ─────────────────────────────────────
        String requestedSkill = req.getSkillWanted().trim().toLowerCase();

        // Does the receiver actually offer this skill?
        boolean receiverOffersIt = receiver.getOfferedSkillNames().stream()
                .anyMatch(s -> s.toLowerCase().contains(requestedSkill)
                            || requestedSkill.contains(s.toLowerCase()));

        if (!receiverOffersIt) {
            throw new ApiException(
                    "\"" + receiver.getName() + "\" does not offer \"" + req.getSkillWanted() + "\". "
                    + "Check their profile to see what skills they can teach.",
                    HttpStatus.BAD_REQUEST);
        }

        // For one-way learning requests: the requested skill must also be something
        // the sender has actually listed as a WANT skill on their own profile.
        if (oneWay) {
            List<String> senderWants = currentUser.getWantedSkillNames().stream()
                    .map(String::toLowerCase).toList();

            boolean senderWantsIt = senderWants.stream()
                    .anyMatch(w -> w.contains(requestedSkill) || requestedSkill.contains(w));

            if (!senderWantsIt) {
                throw new ApiException(
                        "You haven't listed \"" + req.getSkillWanted() + "\" as a skill you want to learn. "
                        + "Add it to your profile's WANT list first.",
                        HttpStatus.BAD_REQUEST);
            }
        }

        // For barter: does the receiver want something the sender offers?
        if (!oneWay) {
            List<String> senderOffers   = currentUser.getOfferedSkillNames().stream()
                    .map(String::toLowerCase).toList();
            List<String> receiverWants  = receiver.getWantedSkillNames().stream()
                    .map(String::toLowerCase).toList();

            boolean hasMatch = receiverWants.stream()
                    .anyMatch(want -> senderOffers.stream()
                            .anyMatch(offer -> offer.contains(want) || want.contains(offer)));

            if (!hasMatch) {
                String youOffer    = currentUser.getOfferedSkillNames().isEmpty()
                        ? "nothing listed" : String.join(", ", currentUser.getOfferedSkillNames());
                String theyWant    = receiver.getWantedSkillNames().isEmpty()
                        ? "nothing listed" : String.join(", ", receiver.getWantedSkillNames());
                throw new ApiException(
                        "Your profile is not compatible with " + receiver.getName() + ". "
                        + "They want to learn: " + theyWant + ". "
                        + "You offer: " + youOffer + ".",
                        HttpStatus.BAD_REQUEST);
            }
        }
        // ─────────────────────────────────────────────────────────────────

        String skillOffered = String.join(", ", currentUser.getOfferedSkillNames());

        SkillRequest skillRequest = SkillRequest.builder()
                .sender(currentUser)
                .receiver(receiver)
                .skillWanted(req.getSkillWanted())
                .skillOffered(skillOffered.isBlank() ? null : skillOffered)
                .comment(req.getComment())
                .status(RequestStatus.PENDING)
                .oneWay(oneWay)
                .build();

        skillRequest = requestRepository.save(skillRequest);

        String msg = oneWay
                ? "Learning request sent to " + receiver.getName() + ". If accepted, 25 points will be deducted."
                : "Barter request sent to " + receiver.getName() + ".";
        notificationService.notify(currentUser, msg);

        return SkillRequestDTO.from(skillRequest);
    }

    @Transactional
    public SkillRequestDTO accept(User currentUser, Long requestId, AcceptRequestDTO body) {
        SkillRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException("Request not found.", HttpStatus.NOT_FOUND));

        if (!req.getReceiver().getId().equals(currentUser.getId())) {
            throw new ApiException("You are not the receiver of this request.", HttpStatus.FORBIDDEN);
        }
        if (req.getStatus() != RequestStatus.PENDING) {
            throw new ApiException("Request is no longer pending.", HttpStatus.BAD_REQUEST);
        }

        checkConflict(req.getSender().getId(), body.getScheduledTime(), null);
        checkConflict(currentUser.getId(), body.getScheduledTime(), null);

        // Bug fix: meeting link was never validated on accept (only on the separate
        // SessionScheduler flow), so invalid/empty links could slip through — including
        // for one-way learning requests accepted straight from the Requests page.
        String link = body.getMeetingLink() == null ? "" : body.getMeetingLink().trim();
        if (!meetingLinkValidator.isValidMeetingLink(link)) {
            throw new ApiException(
                    "Invalid meeting link. Supported providers: Google Meet, Zoom, Microsoft Teams, Jitsi. "
                            + "Link must use https://.",
                    HttpStatus.BAD_REQUEST);
        }

        boolean oneWay = req.isOneWay();
        User sender = req.getSender();

        if (oneWay) {
            if (sender.getPoints() < 25) {
                throw new ApiException("Sender does not have enough points (needs 25).", HttpStatus.BAD_REQUEST);
            }
            sender.setPoints(sender.getPoints() - 25);
            userRepository.save(sender);
            notificationService.notify(sender,
                    "Your one-way learning request was accepted! 25 points deducted. Remaining: " + sender.getPoints());
        }

        Session session = Session.builder()
                .user1(sender)
                .user2(req.getReceiver())
                .skill(req.getSkillWanted())
                .hostUserId(req.getReceiver().getId())
                .sessionRequestId(req.getId())
                .scheduledTime(body.getScheduledTime())
                .meetingLink(link)
                .meetingProvider(meetingLinkValidator.detectProvider(link))
                .status(SessionStatus.SCHEDULED)
                .oneWay(oneWay)
                .build();
        sessionRepository.save(session);

        req.setStatus(RequestStatus.ACCEPTED);
        req = requestRepository.save(req);

        notificationService.notify(currentUser,
                "You accepted request #" + requestId + ". Session scheduled for " + body.getScheduledTime());

        // ── Auto-create chat room ──────────────────────────────────────────
        chatService.getOrCreateRoom(req.getId());
        notificationService.notify(sender,
                "Your session was accepted! A chat room is now open — go to Chat to connect with " + currentUser.getName() + ".");
        notificationService.notify(currentUser,
                "A chat room with " + sender.getName() + " has been created. Go to Chat to connect!");
        // ──────────────────────────────────────────────────────────────────

        return SkillRequestDTO.from(req);
    }

    @Transactional
    public SkillRequestDTO reject(User currentUser, Long requestId) {
        SkillRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException("Request not found.", HttpStatus.NOT_FOUND));

        if (!req.getReceiver().getId().equals(currentUser.getId())) {
            throw new ApiException("You are not the receiver of this request.", HttpStatus.FORBIDDEN);
        }

        req.setStatus(RequestStatus.REJECTED);
        req = requestRepository.save(req);
        notificationService.notify(currentUser, "Request #" + requestId + " rejected.");
        return SkillRequestDTO.from(req);
    }

    private void checkConflict(Long userId, String proposedTimeStr, Long excludeSessionId) {
        LocalDateTime proposed;
        try {
            proposed = LocalDateTime.parse(proposedTimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception e) {
            return;
        }

        List<Session> existing = sessionRepository.findByUser1IdOrUser2IdOrderByIdDesc(userId, userId);
        boolean conflict = existing.stream()
                .filter(s -> s.getStatus() == SessionStatus.SCHEDULED)
                .filter(s -> excludeSessionId == null || !s.getId().equals(excludeSessionId))
                .filter(s -> s.getScheduledTime() != null)
                .anyMatch(s -> {
                    try {
                        LocalDateTime t = LocalDateTime.parse(s.getScheduledTime(),
                                DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                        return Math.abs(ChronoUnit.MINUTES.between(proposed, t)) < 60;
                    } catch (Exception e) {
                        return false;
                    }
                });

        if (conflict) {
            throw new ApiException(
                    "One or both users already have a session within 1 hour of the proposed time.",
                    HttpStatus.CONFLICT);
        }
    }
}