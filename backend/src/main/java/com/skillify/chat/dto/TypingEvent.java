package com.skillify.chat.dto;

import lombok.Data;

@Data
public class TypingEvent {
    private Long roomId;
    private Long userId;
    private String userName;
    private boolean typing;
}
