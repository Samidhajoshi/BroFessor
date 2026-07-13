package com.skillify.chat.repository;

import com.skillify.chat.entity.Message;
import com.skillify.chat.entity.ReadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /** All messages in a room, chronological order. */
    List<Message> findByChatRoomIdOrderBySentAtAsc(Long chatRoomId);

    /** Unread count for a user across all rooms (for badge). */
    long countByReceiverIdAndReadStatus(Long receiverId, ReadStatus status);

    /** Mark all unread messages in a room as READ for a given receiver. */
    @Modifying
    @Query("""
        UPDATE Message m SET m.readStatus = 'READ'
        WHERE m.chatRoom.id = :roomId
          AND m.receiver.id = :userId
          AND m.readStatus <> 'READ'
        """)
    int markRoomAsRead(@Param("roomId") Long roomId, @Param("userId") Long userId);
}
