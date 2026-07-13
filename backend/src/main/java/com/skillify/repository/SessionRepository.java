package com.skillify.repository;

import com.skillify.entity.Session;
import com.skillify.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, Long> {

    List<Session> findByUser1IdOrUser2IdOrderByIdDesc(Long user1Id, Long user2Id);

    List<Session> findByStatusAndScheduledTimeIsNotNull(SessionStatus status);

    Optional<Session> findBySessionRequestId(Long sessionRequestId);

    /**
     * Returns all sessions where the given user received a rating (i.e. has at
     * least one review written for them), ordered newest first.
     */
    @Query("""
        SELECT s FROM Session s
        WHERE (s.user1.id = :userId AND s.user2Rating > 0)
           OR (s.user2.id = :userId AND s.user1Rating > 0)
        ORDER BY s.id DESC
        """)
    List<Session> findReviewsForUser(@Param("userId") Long userId);
}
