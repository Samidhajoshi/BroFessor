package com.skillify.dto;

import com.skillify.entity.Notification;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationDTO {
    private Long id;
    private String message;
    private boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationDTO from(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .message(n.getMessage())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
