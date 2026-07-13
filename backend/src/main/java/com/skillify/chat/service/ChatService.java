package com.skillify.chat.service;

import com.skillify.chat.dto.ChatRoomDTO;
import com.skillify.chat.dto.MessageDTO;
import com.skillify.chat.dto.SendMessageRequest;
import com.skillify.chat.entity.ChatRoom;
import com.skillify.chat.entity.Message;
import com.skillify.chat.entity.MessageType;
import com.skillify.chat.entity.ReadStatus;
import com.skillify.chat.repository.ChatRoomRepository;
import com.skillify.chat.repository.MessageRepository;
import com.skillify.entity.SkillRequest;
import com.skillify.entity.User;
import com.skillify.exception.ApiException;
import com.skillify.repository.SkillRequestRepository;
import com.skillify.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SkillRequestRepository skillRequestRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final PresenceService presenceService;

    // ── Room management ────────────────────────────────────────────────────

    /**
     * Creates a chat room for an accepted session request.
     * Idempotent: returns the existing room if one already exists.
     * Called automatically from SkillRequestService.accept().
     */
    @Transactional
    public ChatRoomDTO getOrCreateRoom(Long sessionRequestId) {
        // Return existing room if one is already tied to this exact request
        return chatRoomRepository.findBySessionRequestId(sessionRequestId)
                .map(ChatRoomDTO::from)
                .orElseGet(() -> {
                    SkillRequest req = skillRequestRepository.findById(sessionRequestId)
                            .orElseThrow(() -> new ApiException("Request not found.", HttpStatus.NOT_FOUND));

                    Long u1 = req.getSender().getId();
                    Long u2 = req.getReceiver().getId();

                    // Bug fix: if these two users already share a chat room from a
                    // previous request/session, reuse it instead of creating a new one.
                    List<ChatRoom> existingRooms = chatRoomRepository.findByUsers(u1, u2);
                    if (!existingRooms.isEmpty()) {
                        return ChatRoomDTO.from(existingRooms.get(0));
                    }

                    ChatRoom room = ChatRoom.builder()
                            .user1(req.getSender())
                            .user2(req.getReceiver())
                            .sessionRequest(req)
                            .build();

                    return ChatRoomDTO.from(chatRoomRepository.save(room));
                });
    }

    @Transactional(readOnly = true)
    public ChatRoomDTO getRoom(Long roomId, User currentUser) {
        ChatRoom room = findRoomOrThrow(roomId);
        assertMember(room, currentUser.getId());

        ChatRoomDTO dto = ChatRoomDTO.from(room);
        dto.setUnreadCount(messageRepository.countByReceiverIdAndReadStatus(
                currentUser.getId(), ReadStatus.SENT));
        return dto;
    }

    @Transactional(readOnly = true)
    public List<ChatRoomDTO> getRoomsForUser(User currentUser) {
        return chatRoomRepository.findByUserId(currentUser.getId()).stream()
                .map(room -> {
                    ChatRoomDTO dto = ChatRoomDTO.from(room);
                    // Last message
                    List<Message> msgs = messageRepository
                            .findByChatRoomIdOrderBySentAtAsc(room.getId());
                    if (!msgs.isEmpty()) {
                        dto.setLastMessage(MessageDTO.from(msgs.get(msgs.size() - 1)));
                    }
                    // Unread count for this room specifically
                    long unread = msgs.stream()
                            .filter(m -> m.getReceiver().getId().equals(currentUser.getId())
                                    && m.getReadStatus() != ReadStatus.READ)
                            .count();
                    dto.setUnreadCount(unread);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // ── Messages ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MessageDTO> getMessages(Long roomId, User currentUser) {
        ChatRoom room = findRoomOrThrow(roomId);
        assertMember(room, currentUser.getId());
        return messageRepository.findByChatRoomIdOrderBySentAtAsc(roomId)
                .stream().map(MessageDTO::from).collect(Collectors.toList());
    }

    /**
     * Persists a message and broadcasts it over WebSocket to /topic/chat/{roomId}.
     * Also updates read status to DELIVERED if the receiver is online.
     */
    @Transactional
    public MessageDTO sendMessage(SendMessageRequest req, User sender) {
        ChatRoom room = findRoomOrThrow(req.getRoomId());
        assertMember(room, sender.getId());

        User receiver = userRepository.findById(req.getReceiverId())
                .orElseThrow(() -> new ApiException("Receiver not found.", HttpStatus.NOT_FOUND));

        ReadStatus initialStatus = presenceService.isOnline(receiver.getId())
                ? ReadStatus.DELIVERED : ReadStatus.SENT;

        Message message = Message.builder()
                .chatRoom(room)
                .sender(sender)
                .receiver(receiver)
                .content(req.getContent())
                .messageType(MessageType.valueOf(req.getMessageType()))
                .readStatus(initialStatus)
                .build();

        message = messageRepository.save(message);
        MessageDTO dto = MessageDTO.from(message);

        // Broadcast to all subscribers of this room
        messagingTemplate.convertAndSend("/topic/chat/" + room.getId(), dto);

        // Also push to receiver's personal queue so they can react cross-rooms
        messagingTemplate.convertAndSendToUser(
                receiver.getEmail(), "/queue/messages", dto);

        log.debug("Message {} sent in room {}", message.getId(), room.getId());
        return dto;
    }

    /** Mark all messages in a room as READ for the current user. */
    @Transactional
    public void markRoomRead(Long roomId, User currentUser) {
        ChatRoom room = findRoomOrThrow(roomId);
        assertMember(room, currentUser.getId());

        int updated = messageRepository.markRoomAsRead(roomId, currentUser.getId());
        if (updated > 0) {
            // Notify the sender(s) their messages were read
            messagingTemplate.convertAndSend("/topic/chat/" + roomId + "/read",
                    java.util.Map.of("roomId", roomId, "readBy", currentUser.getId()));
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private ChatRoom findRoomOrThrow(Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException("Chat room not found.", HttpStatus.NOT_FOUND));
    }

    private void assertMember(ChatRoom room, Long userId) {
        boolean isMember = room.getUser1().getId().equals(userId)
                || room.getUser2().getId().equals(userId);
        if (!isMember) {
            throw new ApiException("You are not a member of this chat room.", HttpStatus.FORBIDDEN);
        }
    }
}
