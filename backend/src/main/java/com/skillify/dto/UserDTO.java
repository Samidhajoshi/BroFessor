package com.skillify.dto;

import com.skillify.entity.User;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private int age;
    private String bio;
    private String profilePhotoUrl;
    private String userType;
    private int points;
    private double averageRating;
    private int totalRatings;
    private String badge;
    private List<UserSkillDTO> skills;

    // ── Social & learning links ───────────────────────────────────────────
    private String githubUrl;
    private String linkedinUrl;
    private String websiteUrl;
    private String learningPlatforms;

    // ── Projects (JSON string, parsed by frontend) ────────────────────────
    private String projects;

    public static UserDTO from(User u) {
        return UserDTO.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .age(u.getAge())
                .bio(u.getBio())
                .profilePhotoUrl(u.getProfilePhotoUrl())
                .userType(u.getUserType().name())
                .points(u.getPoints())
                .averageRating(u.getAverageRating())
                .totalRatings(u.getTotalRatings())
                .badge(u.getBadge())
                .skills(u.getSkills().stream().map(UserSkillDTO::from).collect(Collectors.toList()))
                .githubUrl(u.getGithubUrl())
                .linkedinUrl(u.getLinkedinUrl())
                .websiteUrl(u.getWebsiteUrl())
                .learningPlatforms(u.getLearningPlatforms())
                .projects(u.getProjects())
                .build();
    }
}
