package com.skillify.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "profile_analysis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "profile_score", nullable = false)
    private int profileScore;

    @Column(columnDefinition = "JSON")
    private String strengths;

    @Column(columnDefinition = "JSON")
    private String weaknesses;

    @Column(columnDefinition = "JSON")
    private String suggestions;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    /** MD5/SHA hash of profile data — used to detect if profile changed */
    @Column(name = "profile_hash", length = 255)
    private String profileHash;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
