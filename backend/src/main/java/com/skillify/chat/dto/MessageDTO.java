package com.skillify.chat.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.skillify.chat.entity.Message;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class MessageDTO {
    private Long id;
    private Long chatRoomId;
    private Long senderId;
    private String senderName;
    private String senderPhoto;
    private Long receiverId;
    private String content;
    private String messageType;
    private String readStatus;
    // Server clock is UTC (Render + serverTimezone=UTC on the JDBC URL) but
    // LocalDateTime carries no zone info on its own, so the JSON we send would
    // have no offset — browsers then misinterpret it as local time. Tagging
    // the literal 'Z' here labels these naive values as UTC without doing any
    // conversion math, which is exactly what the frontend needs to parse them
    // correctly regardless of the viewer's timezone.
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime sentAt;

    public static MessageDTO from(Message m) {
        return MessageDTO.builder()
                .id(m.getId())
                .chatRoomId(m.getChatRoom().getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getName())
                .senderPhoto(m.getSender().getProfilePhotoUrl())
                .receiverId(m.getReceiver().getId())
                .content(m.getContent())
                .messageType(m.getMessageType().name())
                .readStatus(m.getReadStatus().name())
                .sentAt(m.getSentAt())
                .build();
    }
}
