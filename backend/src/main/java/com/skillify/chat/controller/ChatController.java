package com.skillify.chat.controller;

import com.skillify.chat.dto.*;
import com.skillify.chat.service.ChatService;
import com.skillify.chat.service.PresenceService;
import com.skillify.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final PresenceService presenceService;

    // ── REST ──────────────────────────────────────────────────────────────

    /** Called automatically on request acceptance; also callable manually. */
    @PostMapping("/api/chat/room/create")
    public ResponseEntity<ChatRoomDTO> createRoom(@RequestParam Long sessionRequestId) {
        return ResponseEntity.ok(chatService.getOrCreateRoom(sessionRequestId));
    }

    @GetMapping("/api/chat/room/{roomId}")
    public ResponseEntity<ChatRoomDTO> getRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(chatService.getRoom(roomId, SecurityUtils.currentUser()));
    }

    @GetMapping("/api/chat/rooms")
    public ResponseEntity<List<ChatRoomDTO>> myRooms() {
        return ResponseEntity.ok(chatService.getRoomsForUser(SecurityUtils.currentUser()));
    }

    @GetMapping("/api/chat/messages/{roomId}")
    public ResponseEntity<List<MessageDTO>> messages(@PathVariable Long roomId) {
        return ResponseEntity.ok(chatService.getMessages(roomId, SecurityUtils.currentUser()));
    }

    @PostMapping("/api/chat/read/{roomId}")
    public ResponseEntity<Void> markRead(@PathVariable Long roomId) {
        chatService.markRoomRead(roomId, SecurityUtils.currentUser());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/chat/presence")
    public ResponseEntity<Set<Long>> onlineUsers() {
        return ResponseEntity.ok(presenceService.onlineUserIds());
    }

    // ── WebSocket message handlers ─────────────────────────────────────────

    /**
     * Client publishes to /app/chat.sendMessage.
     * Persists the message and broadcasts to /topic/chat/{roomId}.
     */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload SendMessageRequest req,
                             SimpMessageHeaderAccessor headerAccessor) {
        com.skillify.entity.User sender = resolveUserFromHeader(headerAccessor);
        chatService.sendMessage(req, sender);
    }

    /**
     * Client publishes to /app/chat.typing.
     * Relayed to /topic/chat/{roomId}/typing for lightweight indicator.
     * No persistence — pure broadcast.
     */
    @MessageMapping("/chat.typing")
    public void typing(@Payload TypingEvent event,
                        SimpMessageHeaderAccessor headerAccessor,
                        org.springframework.messaging.simp.SimpMessagingTemplate template) {
        template.convertAndSend("/topic/chat/" + event.getRoomId() + "/typing", event);
    }

    // ── Helper ─────────────────────────────────────────────────────────────

    private com.skillify.entity.User resolveUserFromHeader(SimpMessageHeaderAccessor accessor) {
        java.security.Principal principal = accessor.getUser();
        if (principal instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof com.skillify.security.UserPrincipal up) {
                return up.getUser();
            }
        }
        throw new com.skillify.exception.ApiException("WebSocket user not authenticated.",
                org.springframework.http.HttpStatus.UNAUTHORIZED);
    }
}
