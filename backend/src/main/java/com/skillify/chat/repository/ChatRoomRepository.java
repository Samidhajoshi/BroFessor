package com.skillify.chat.repository;

import com.skillify.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    Optional<ChatRoom> findBySessionRequestId(Long sessionRequestId);

    /** All rooms the current user is a member of, newest first. */
    @Query("""
        SELECT r FROM ChatRoom r
        WHERE r.user1.id = :userId OR r.user2.id = :userId
        ORDER BY r.createdAt DESC
        """)
    List<ChatRoom> findByUserId(@Param("userId") Long userId);

    /** Does a room exist between these two users for this request? */
    @Query("""
        SELECT r FROM ChatRoom r
        WHERE r.sessionRequest.id = :requestId
          AND ((r.user1.id = :u1 AND r.user2.id = :u2)
            OR (r.user1.id = :u2 AND r.user2.id = :u1))
        """)
    Optional<ChatRoom> findByRequestAndUsers(@Param("requestId") Long requestId,
                                              @Param("u1") Long u1,
                                              @Param("u2") Long u2);

    /** Does ANY room already exist between these two users, regardless of which request spawned it? */
    @Query("""
        SELECT r FROM ChatRoom r
        WHERE (r.user1.id = :u1 AND r.user2.id = :u2)
           OR (r.user1.id = :u2 AND r.user2.id = :u1)
        ORDER BY r.createdAt ASC
        """)
    List<ChatRoom> findByUsers(@Param("u1") Long u1, @Param("u2") Long u2);
}
