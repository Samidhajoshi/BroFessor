package com.skillify.chat.dto;

import com.skillify.chat.entity.ChatRoom;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class ChatRoomDTO {
    private Long id;
    private Long user1Id;
    private String user1Name;
    private String user1Photo;
    private Long user2Id;
    private String user2Name;
    private String user2Photo;
    private Long sessionRequestId;
    private LocalDateTime createdAt;
    private long unreadCount;
    private MessageDTO lastMessage;

    public static ChatRoomDTO from(ChatRoom r) {
        return ChatRoomDTO.builder()
                .id(r.getId())
                .user1Id(r.getUser1().getId())
                .user1Name(r.getUser1().getName())
                .user1Photo(r.getUser1().getProfilePhotoUrl())
                .user2Id(r.getUser2().getId())
                .user2Name(r.getUser2().getName())
                .user2Photo(r.getUser2().getProfilePhotoUrl())
                .sessionRequestId(r.getSessionRequest().getId())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
