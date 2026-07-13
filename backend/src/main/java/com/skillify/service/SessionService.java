package com.skillify.service;

import com.skillify.dto.CreateSessionRequest;
import com.skillify.dto.ReviewDTO;
import com.skillify.dto.SessionDTO;
import com.skillify.dto.UpdateSessionRequest;
import com.skillify.entity.*;
import com.skillify.exception.ApiException;
import com.skillify.repository.SessionRepository;
import com.skillify.repository.SkillRequestRepository;
import com.skillify.repository.UserRepository;
import com.skillify.util.MeetingLinkValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionService {

    private static final String GOLD   = "GOLD";
    private static final String SILVER = "SILVER";
    private static final String BRONZE = "BRONZE";
    private static final String NONE   = "NONE";

    private final SessionRepository sessionRepository;
    private final SkillRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final MeetingLinkValidator meetingLinkValidator;

    // ── Scheduling ────────────────────────────────────────────────────────

    /**
     * Create a new session from an accepted SkillRequest.
     * Only the two participants of the accepted request may call this.
     */
    @Transactional
    public SessionDTO createSession(User currentUser, CreateSessionRequest req) {
        // 1. Load the SkillRequest
        SkillRequest skillReq = requestRepository.findById(req.getSessionRequestId())
                .orElseThrow(() -> new ApiException("Skill request not found.", HttpStatus.NOT_FOUND));

        // 2. Only participants may create a session
        Long myId = currentUser.getId();
        boolean isSender   = skillReq.getSender().getId().equals(myId);
        boolean isReceiver = skillReq.getReceiver().getId().equals(myId);
        if (!isSender && !isReceiver) {
            throw new ApiException("You are not a participant of this request.", HttpStatus.FORBIDDEN);
        }

        // 3. Request must be accepted
        if (skillReq.getStatus() != RequestStatus.ACCEPTED) {
            throw new ApiException(
                    "Sessions can only be created for ACCEPTED requests (current status: "
                            + skillReq.getStatus() + ").",
                    HttpStatus.BAD_REQUEST);
        }

        // 4. Validate meeting link
        String link = req.getMeetingLink().trim();
        if (!meetingLinkValidator.isValidMeetingLink(link)) {
            throw new ApiException(
                    "Invalid meeting link. Supported providers: Google Meet, Zoom, Microsoft Teams, Jitsi. "
                            + "Link must use https://.",
                    HttpStatus.BAD_REQUEST);
        }

        // 5. Detect provider
        MeetingProvider provider = meetingLinkValidator.detectProvider(link);

        // 6. Build & save session
        Session session = Session.builder()
                .user1(skillReq.getSender())
                .user2(skillReq.getReceiver())
                .hostUserId(myId)
                .sessionRequestId(skillReq.getId())
                .skill(skillReq.getSkillWanted())
                .scheduledTime(req.getScheduledTime().trim())
                .meetingLink(link)
                .meetingProvider(provider)
                .status(SessionStatus.SCHEDULED)
                .oneWay(skillReq.isOneWay())
                .build();

        session = sessionRepository.save(session);

        // 7. Notify both parties
        String other = isSender ? skillReq.getReceiver().getName() : skillReq.getSender().getName();
        notificationService.notify(currentUser,
                "Session scheduled! Provider: " + provider.name() + ". Time: " + req.getScheduledTime());
        notificationService.notify(isSender ? skillReq.getReceiver() : skillReq.getSender(),
                currentUser.getName() + " scheduled your \"" + skillReq.getSkillWanted()
                        + "\" session. Check Sessions for details.");

        return SessionDTO.from(session);
    }

    /**
     * Update an existing session (reschedule or change meeting link).
     * Only the host may update.
     */
    @Transactional
    public SessionDTO updateSession(User currentUser, Long sessionId, UpdateSessionRequest req) {
        Session session = findOrThrow(sessionId);
        assertParticipant(session, currentUser.getId());

        // Only the host can update
        if (!currentUser.getId().equals(session.getHostUserId())) {
            throw new ApiException("Only the session host can update this session.", HttpStatus.FORBIDDEN);
        }

        if (session.getStatus() != SessionStatus.SCHEDULED) {
            throw new ApiException("Only SCHEDULED sessions can be updated.", HttpStatus.BAD_REQUEST);
        }

        if (req.getScheduledTime() != null && !req.getScheduledTime().isBlank()) {
            session.setScheduledTime(req.getScheduledTime().trim());
        }

        if (req.getMeetingLink() != null && !req.getMeetingLink().isBlank()) {
            String link = req.getMeetingLink().trim();
            if (!meetingLinkValidator.isValidMeetingLink(link)) {
                throw new ApiException(
                        "Invalid meeting link. Supported providers: Google Meet, Zoom, Microsoft Teams, Jitsi.",
                        HttpStatus.BAD_REQUEST);
            }
            session.setMeetingLink(link);
            session.setMeetingProvider(meetingLinkValidator.detectProvider(link));
        }

        session = sessionRepository.save(session);

        User other = session.getUser1().getId().equals(currentUser.getId())
                ? session.getUser2() : session.getUser1();
        notificationService.notify(other,
                currentUser.getName() + " updated your \"" + session.getSkill() + "\" session details.");

        return SessionDTO.from(session);
    }

    /** Cancel a session. Either participant may cancel. */
    @Transactional
    public SessionDTO cancelSession(User currentUser, Long sessionId) {
        Session session = findOrThrow(sessionId);
        assertParticipant(session, currentUser.getId());

        if (session.getStatus() != SessionStatus.SCHEDULED && session.getStatus() != SessionStatus.ONGOING) {
            throw new ApiException("Session cannot be cancelled in its current state.", HttpStatus.BAD_REQUEST);
        }

        session.setStatus(SessionStatus.CANCELLED);
        session = sessionRepository.save(session);

        // Bug fix: one-way sessions deduct 25 points from the learner (user1) at accept
        // time. Cancelling previously left those points gone forever — refund them here.
        if (session.isOneWay()) {
            User learner = userRepository.findById(session.getUser1().getId())
                    .orElseThrow(() -> new ApiException("Learner not found.", HttpStatus.NOT_FOUND));
            learner.setPoints(learner.getPoints() + 25);
            userRepository.save(learner);
            notificationService.notify(learner,
                    "Your \"" + session.getSkill() + "\" session was cancelled. 25 points refunded. Total: " + learner.getPoints());
        }

        User other = session.getUser1().getId().equals(currentUser.getId())
                ? session.getUser2() : session.getUser1();
        notificationService.notify(other,
                currentUser.getName() + " cancelled the \"" + session.getSkill() + "\" session.");
        notificationService.notify(currentUser, "Session \"" + session.getSkill() + "\" cancelled.");

        return SessionDTO.from(session);
    }

    /** Delete a session. Only host can delete, and only if CANCELLED. */
    @Transactional
    public void deleteSession(User currentUser, Long sessionId) {
        Session session = findOrThrow(sessionId);
        assertParticipant(session, currentUser.getId());

        if (!currentUser.getId().equals(session.getHostUserId())) {
            throw new ApiException("Only the session host can delete this session.", HttpStatus.FORBIDDEN);
        }
        if (session.getStatus() != SessionStatus.CANCELLED) {
            throw new ApiException("Only CANCELLED sessions can be deleted.", HttpStatus.BAD_REQUEST);
        }

        sessionRepository.delete(session);
    }

    // ── Read ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SessionDTO> getMySessions(User currentUser) {
        return sessionRepository
                .findByUser1IdOrUser2IdOrderByIdDesc(currentUser.getId(), currentUser.getId())
                .stream().map(SessionDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public SessionDTO getById(User currentUser, Long id) {
        Session session = findOrThrow(id);
        assertParticipant(session, currentUser.getId());
        return SessionDTO.from(session);
    }

    // ── Complete + Rating (existing flows) ────────────────────────────────

    @Transactional
    public SessionDTO complete(User currentUser, Long sessionId) {
        Session session = findOrThrow(sessionId);
        assertParticipant(session, currentUser.getId());

        if (session.getStatus() != SessionStatus.SCHEDULED
                && session.getStatus() != SessionStatus.ONGOING) {
            throw new ApiException("Session is not in an active state.", HttpStatus.BAD_REQUEST);
        }

        Long myId      = currentUser.getId();
        boolean imUser1 = session.getUser1().getId().equals(myId);
        boolean oneWay  = session.isOneWay();

        session.setStatus(SessionStatus.COMPLETED);
        sessionRepository.save(session);

        User me = userRepository.findById(myId)
                .orElseThrow(() -> new ApiException("User not found.", HttpStatus.NOT_FOUND));

        if (oneWay) {
            // Bug fix #5: teacher (user2 = receiver) ALWAYS gets 25 points when session is completed,
            // regardless of who clicks "Mark Complete".
            User teacher = session.getUser2();
            User learner = session.getUser1();
            teacher = userRepository.findById(teacher.getId())
                    .orElseThrow(() -> new ApiException("Teacher not found.", HttpStatus.NOT_FOUND));
            teacher.setPoints(teacher.getPoints() + 25);
            userRepository.save(teacher);
            notificationService.notify(teacher,
                    "Session completed! You earned 25 points for teaching \"" + session.getSkill() + "\". Total: " + teacher.getPoints());
            // Notify learner too if they aren't the one who triggered this
            if (imUser1) {
                notificationService.notify(me,
                        "Session completed! You have learned " + session.getSkill() + ".");
            }
        } else {
            me.setPoints(me.getPoints() + 10);
            userRepository.save(me);
            notificationService.notify(me,
                    "Barter session completed! You earned 10 points. Total: " + me.getPoints());
        }

        return SessionDTO.from(session);
    }

    @Transactional
    public SessionDTO submitRating(User currentUser, Long sessionId, int rating, String review) {
        Session session = findOrThrow(sessionId);
        assertParticipant(session, currentUser.getId());

        Long myId       = currentUser.getId();
        boolean imUser1 = session.getUser1().getId().equals(myId);
        User target     = imUser1 ? session.getUser2() : session.getUser1();

        if (imUser1) {
            session.setUser1Rating(rating);
            session.setUser1Review(review);
        } else {
            session.setUser2Rating(rating);
            session.setUser2Review(review);
        }
        sessionRepository.save(session);

        applyRating(target, rating);

        notificationService.notify(currentUser, "Rating submitted. Thank you for your feedback!");
        notificationService.notify(target,
                currentUser.getName() + " left you a review for the \"" + session.getSkill() + "\" session.");

        return SessionDTO.from(session);
    }

    @Transactional(readOnly = true)
    public List<ReviewDTO> getReviewsForUser(Long userId) {
        return sessionRepository.findReviewsForUser(userId).stream()
                .map(s -> {
                    boolean targetIsUser1 = s.getUser1().getId().equals(userId);
                    User reviewer = targetIsUser1 ? s.getUser2() : s.getUser1();
                    int r         = targetIsUser1 ? s.getUser2Rating() : s.getUser1Rating();
                    String text   = targetIsUser1 ? s.getUser2Review() : s.getUser1Review();

                    return ReviewDTO.builder()
                            .sessionId(s.getId())
                            .reviewerId(reviewer.getId())
                            .reviewerName(reviewer.getName())
                            .reviewerPhotoUrl(reviewer.getProfilePhotoUrl())
                            .rating(r)
                            .review(text)
                            .skill(s.getSkill())
                            .sessionDate(s.getScheduledTime())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private void assertParticipant(Session session, Long userId) {
        if (!session.belongsTo(userId)) {
            throw new ApiException("Access denied — you are not a participant of this session.",
                    HttpStatus.FORBIDDEN);
        }
    }

    private void applyRating(User target, int rating) {
        int sum    = target.getTotalRatingSum() + rating;
        int count  = target.getTotalRatings()   + 1;
        double avg = (double) sum / count;

        String badge = avg > 70 ? GOLD : avg > 50 ? SILVER : avg > 40 ? BRONZE : NONE;

        target.setTotalRatingSum(sum);
        target.setTotalRatings(count);
        target.setBadge(badge);
        userRepository.save(target);
    }

    private Session findOrThrow(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ApiException("Session not found.", HttpStatus.NOT_FOUND));
    }
}
