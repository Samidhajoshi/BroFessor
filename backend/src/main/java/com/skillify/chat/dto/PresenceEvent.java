package com.skillify.chat.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class PresenceEvent {
    private Long userId;
    private String userName;
    private String status; // ONLINE | OFFLINE
    private LocalDateTime lastSeen;
}
