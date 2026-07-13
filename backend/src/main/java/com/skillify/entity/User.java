package com.skillify.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    private int age = 0;

    @Column(length = 500)
    private String bio;

    private String profilePhotoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserType userType;

    @Builder.Default
    private int points = 100;

    @Builder.Default
    private int totalRatingSum = 0;

    @Builder.Default
    private int totalRatings = 0;

    @Builder.Default
    private String badge = "NONE";

    // ── Social & learning links ───────────────────────────────────────────
    @Column(name = "github_url", length = 300)
    private String githubUrl;

    @Column(name = "linkedin_url", length = 300)
    private String linkedinUrl;

    /** Comma-separated list of other platform URLs (e.g. Coursera, Udemy, etc.) */
    @Column(name = "learning_platforms", length = 1000)
    private String learningPlatforms;

    /** Personal website / portfolio URL */
    @Column(name = "website_url", length = 300)
    private String websiteUrl;

    // ── Projects (stored as JSON string, parsed on frontend) ─────────────
    /**
     * JSON array string of project objects:
     * [{"title":"…","description":"…","url":"…","tags":["React","Java"]}]
     */
    @Column(name = "projects", columnDefinition = "TEXT")
    private String projects;

    // ── Skills ───────────────────────────────────────────────────────────
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<UserSkill> skills = new ArrayList<>();

    @Transient
    public double getAverageRating() {
        if (totalRatings == 0) return 0.0;
        return (double) totalRatingSum / totalRatings;
    }

    @Transient
    public List<String> getOfferedSkillNames() {
        return skills.stream()
                .filter(s -> s.getType() == SkillType.OFFER)
                .map(UserSkill::getSkillName)
                .collect(Collectors.toList());
    }

    @Transient
    public List<String> getWantedSkillNames() {
        return skills.stream()
                .filter(s -> s.getType() == SkillType.WANT)
                .map(UserSkill::getSkillName)
                .collect(Collectors.toList());
    }
}
