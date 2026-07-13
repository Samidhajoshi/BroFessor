package com.skillify.chat.dto;

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
