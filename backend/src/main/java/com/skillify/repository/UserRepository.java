package com.skillify.repository;

import com.skillify.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
        SELECT u FROM User u
        ORDER BY (CAST(u.totalRatingSum AS double) /
                  CASE WHEN u.totalRatings = 0 THEN 1 ELSE u.totalRatings END) DESC
        """)
    List<User> findAllOrderByAverageRatingDesc();

    /**
     * Find BARTER_USERs who have an OFFER skill matching the search term.
     */
    @Query("""
        SELECT DISTINCT u FROM User u
        JOIN u.skills s
        WHERE u.userType = com.skillify.entity.UserType.BARTER_USER
          AND s.type = com.skillify.entity.SkillType.OFFER
          AND LOWER(s.skillName) LIKE LOWER(CONCAT('%', :skillWanted, '%'))
        """)
    List<User> searchBarterUsers(@Param("skillWanted") String skillWanted);

    /**
     * Find any user by name (case-insensitive partial match).
     */
    @Query("""
        SELECT u FROM User u
        WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%'))
        ORDER BY u.name ASC
        """)
    List<User> searchByName(@Param("name") String name);

    /**
     * All SCHEDULED sessions — used by the reminder scheduler.
     */
    @Query("""
        SELECT s FROM Session s
        WHERE s.status = com.skillify.entity.SessionStatus.SCHEDULED
          AND s.scheduledTime IS NOT NULL
        """)
    List<com.skillify.entity.Session> findScheduledSessions();
}
