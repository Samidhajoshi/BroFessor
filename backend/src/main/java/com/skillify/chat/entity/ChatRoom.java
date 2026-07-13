package com.skillify.chat.entity;

import com.skillify.entity.SkillRequest;
import com.skillify.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One ChatRoom is created per accepted SkillRequest.
 * The UNIQUE constraint on session_request_id prevents duplicates.
 *
 * Designed for future group-chat: user1/user2 could be replaced by
 * a @ManyToMany participants list without touching MessageEntity.
 */
@Entity
@Table(name = "chat_rooms",
       uniqueConstraints = @UniqueConstraint(columnNames = "session_request_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;

    /** The accepted request that spawned this room. */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_request_id", nullable = false)
    private SkillRequest sessionRequest;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
