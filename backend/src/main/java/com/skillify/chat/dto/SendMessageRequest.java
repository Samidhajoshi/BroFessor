package com.skillify.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotNull(message = "roomId is required")
    private Long roomId;

    @NotNull(message = "senderId is required")
    private Long senderId;

    @NotNull(message = "receiverId is required")
    private Long receiverId;

    @NotBlank(message = "content is required")
    private String content;

    /** TEXT | IMAGE | FILE | SYSTEM — defaults to TEXT if omitted */
    private String messageType = "TEXT";
}
