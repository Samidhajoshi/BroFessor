package com.skillify.scheduler;

import com.skillify.entity.Session;
import com.skillify.entity.SessionStatus;
import com.skillify.repository.NotificationRepository;
import com.skillify.repository.SessionRepository;
import com.skillify.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Runs every 60 seconds and fires reminder notifications at:
 *  • 30 minutes before session
 *  • 10 minutes before session
 *  •  0 minutes (at session start time)
 *
 * Uses boolean flags on Session to guarantee each reminder fires only once,
 * even if the scheduler overlaps its own tick.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private final SessionRepository sessionRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<Session> sessions = sessionRepository.findByStatusAndScheduledTimeIsNotNull(SessionStatus.SCHEDULED);

        for (Session session : sessions) {
            try {
                process(session, now);
            } catch (Exception e) {
                log.warn("Reminder processing failed for session {}: {}", session.getId(), e.getMessage());
            }
        }
    }

    private void process(Session session, LocalDateTime now) {
        LocalDateTime sessionTime = LocalDateTime.parse(
                session.getScheduledTime(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        long minutesUntil = ChronoUnit.MINUTES.between(now, sessionTime);

        String skill = session.getSkill();
        String link  = session.getMeetingLink() != null ? " Join: " + session.getMeetingLink() : "";

        // ── 30-minute reminder ───────────────────────────────────────────────
        if (!session.isReminder30Sent() && minutesUntil >= 28 && minutesUntil <= 32) {
            String msg = "⏰ Reminder: Your session \"" + skill + "\" starts in 30 minutes!" + link;
            notificationService.notify(session.getUser1(), msg);
            notificationService.notify(session.getUser2(), msg);
            session.setReminder30Sent(true);
            sessionRepository.save(session);
        }

        // ── 10-minute reminder ───────────────────────────────────────────────
        if (!session.isReminder10Sent() && minutesUntil >= 8 && minutesUntil <= 12) {
            String msg = "⏰ Reminder: Your session \"" + skill + "\" starts in 10 minutes!" + link;
            notificationService.notify(session.getUser1(), msg);
            notificationService.notify(session.getUser2(), msg);
            session.setReminder10Sent(true);
            sessionRepository.save(session);
        }

        // ── At-time reminder ─────────────────────────────────────────────────
        if (!session.isReminderAtSent() && minutesUntil >= -2 && minutesUntil <= 2) {
            String msg = "🚀 Your session \"" + skill + "\" is starting now!" + link;
            notificationService.notify(session.getUser1(), msg);
            notificationService.notify(session.getUser2(), msg);
            session.setReminderAtSent(true);
            sessionRepository.save(session);
        }
    }
}
