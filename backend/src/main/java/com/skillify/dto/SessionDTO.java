package com.skillify.dto;

import com.skillify.entity.Session;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SessionDTO {
    private Long id;
    private Long sessionRequestId;
    private Long hostUserId;

    // Participants
    private Long user1Id;
    private String user1Name;
    private String user1PhotoUrl;
    private Long user2Id;
    private String user2Name;
    private String user2PhotoUrl;

    // Content
    private String skill;
    private String scheduledTime;
    private String meetingLink;
    private String meetingProvider;

    // Status / type
    private String status;
    private boolean oneWay;

    // Ratings
    private int user1Rating;
    private int user2Rating;
    private String user1Review;
    private String user2Review;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SessionDTO from(Session s) {
        return SessionDTO.builder()
                .id(s.getId())
                .sessionRequestId(s.getSessionRequestId())
                .hostUserId(s.getHostUserId())
                .user1Id(s.getUser1().getId())
                .user1Name(s.getUser1().getName())
                .user1PhotoUrl(s.getUser1().getProfilePhotoUrl())
                .user2Id(s.getUser2().getId())
                .user2Name(s.getUser2().getName())
                .user2PhotoUrl(s.getUser2().getProfilePhotoUrl())
                .skill(s.getSkill())
                .scheduledTime(s.getScheduledTime())
                .meetingLink(s.getMeetingLink())
                .meetingProvider(s.getMeetingProvider() != null ? s.getMeetingProvider().name() : null)
                .status(s.getStatus().name())
                .oneWay(s.isOneWay())
                .user1Rating(s.getUser1Rating())
                .user2Rating(s.getUser2Rating())
                .user1Review(s.getUser1Review())
                .user2Review(s.getUser2Review())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
