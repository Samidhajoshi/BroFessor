package com.skillify.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Participants (legacy field names kept for compatibility) ─────────
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;

    /** The user who created/hosts this session (may be user1 or user2). */
    @Column(name = "host_user_id")
    private Long hostUserId;

    /** FK back to the SkillRequest that originated this session. */
    @Column(name = "session_request_id")
    private Long sessionRequestId;

    // ── Content ──────────────────────────────────────────────────────────
    @Column(nullable = false)
    private String skill;

    /** ISO-8601 string — e.g. "2025-08-10T14:30:00" */
    private String scheduledTime;

    @Column(length = 2048)
    private String meetingLink;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private MeetingProvider meetingProvider;

    // ── Status ───────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionStatus status = SessionStatus.SCHEDULED;

    @Column(nullable = false)
    private boolean oneWay;

    // ── Ratings & reviews ────────────────────────────────────────────────
    @Builder.Default
    private int user1Rating = 0;

    @Builder.Default
    private int user2Rating = 0;

    @Column(length = 1000)
    private String user1Review;

    @Column(length = 1000)
    private String user2Review;

    // ── Reminder tracking ────────────────────────────────────────────────
    @Builder.Default
    private boolean reminder30Sent = false;

    @Builder.Default
    private boolean reminder10Sent = false;

    @Builder.Default
    private boolean reminderAtSent = false;

    // ── Audit ────────────────────────────────────────────────────────────
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Helper ───────────────────────────────────────────────────────────
    /** Returns true if the given userId is a participant (user1 or user2). */
    public boolean belongsTo(Long userId) {
        return user1.getId().equals(userId) || user2.getId().equals(userId);
    }
}
