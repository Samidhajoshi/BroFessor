package com.skillify.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillify.entity.SessionStatus;
import com.skillify.entity.SkillType;
import com.skillify.entity.User;
import com.skillify.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Pure rule-based engine. Calculates score, strengths, weaknesses, and suggestions.
 * NEVER calls AI — that is GroqService's job.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileScoreService {

    private final SessionRepository sessionRepository;
    private final ObjectMapper objectMapper;

    public record ScoreResult(
            int score,
            List<String> strengths,
            List<String> weaknesses,
            List<String> suggestions
    ) {}

    public ScoreResult analyze(User user) {
        int score = 0;
        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        // ── Bio ──────────────────────────────────────────────────────────
        String bio = user.getBio();
        if (bio != null && !bio.isBlank()) {
            score += 10;
            if (bio.length() > 100) {
                score += 10;
                strengths.add("Detailed Profile");
            } else {
                weaknesses.add("Short Bio");
                suggestions.add("Expand your bio to over 100 characters to give others a better sense of who you are");
            }
        } else {
            weaknesses.add("Missing Bio");
            suggestions.add("Add a bio describing your background, interests, and what you want to learn or teach");
        }

        // ── Skills ───────────────────────────────────────────────────────
        long offeredSkills = user.getSkills().stream()
                .filter(s -> s.getType() == SkillType.OFFER).count();
        long wantedSkills = user.getSkills().stream()
                .filter(s -> s.getType() == SkillType.WANT).count();
        long totalSkills = offeredSkills + wantedSkills;

        if (totalSkills >= 6) {
            score += 15;
            strengths.add("Strong Skill Portfolio");
        } else if (totalSkills >= 3) {
            score += 10;
        } else if (totalSkills >= 1) {
            score += 5;
            weaknesses.add("Limited Skill Coverage");
            suggestions.add("Add more skills (both offered and wanted) to increase your chances of finding matches");
        } else {
            weaknesses.add("No Skills Listed");
            suggestions.add("Add at least one skill you can offer and one you want to learn");
        }

        if (offeredSkills == 0) {
            weaknesses.add("No Skills Offered");
            suggestions.add("List skills you can teach so others can find and request sessions with you");
        }

        // ── GitHub ───────────────────────────────────────────────────────
        if (user.getGithubUrl() != null && !user.getGithubUrl().isBlank()) {
            score += 15;
            strengths.add("GitHub Profile Linked");
        } else {
            weaknesses.add("Missing GitHub Profile");
            suggestions.add("Link your GitHub profile to showcase your code and projects to potential exchange partners");
        }

        // ── LinkedIn ─────────────────────────────────────────────────────
        if (user.getLinkedinUrl() != null && !user.getLinkedinUrl().isBlank()) {
            score += 10;
            strengths.add("LinkedIn Profile Linked");
        } else {
            weaknesses.add("Missing LinkedIn Profile");
            suggestions.add("Add your LinkedIn URL to establish professional credibility");
        }

        // ── Projects ─────────────────────────────────────────────────────
        int projectCount = countProjects(user.getProjects());
        if (projectCount >= 2) {
            score += 15;
            strengths.add("Strong Project Portfolio");
        } else if (projectCount == 1) {
            score += 5;
            weaknesses.add("Few Projects");
            suggestions.add("Add more projects to your profile to demonstrate your practical experience");
        } else {
            weaknesses.add("No Projects Listed");
            suggestions.add("Add at least two projects with descriptions to showcase your work");
        }

        // ── Completed Sessions ────────────────────────────────────────────
        long completedSessions = sessionRepository
                .findByUser1IdOrUser2IdOrderByIdDesc(user.getId(), user.getId())
                .stream()
                .filter(s -> s.getStatus() == SessionStatus.COMPLETED)
                .count();

        if (completedSessions >= 10) {
            score += 15;
            strengths.add("Active Community Member");
        } else if (completedSessions >= 5) {
            score += 10;
        } else if (completedSessions >= 1) {
            score += 5;
            weaknesses.add("Low Session Activity");
            suggestions.add("Complete more skill exchange sessions to build trust and earn a higher badge");
        } else {
            weaknesses.add("No Completed Sessions");
            suggestions.add("Accept or create a session request to start building your reputation on the platform");
        }

        // ── Rating ───────────────────────────────────────────────────────
        double avgRating = user.getAverageRating();
        if (avgRating >= 4.5) {
            score += 10;
            strengths.add("Highly Rated Mentor");
        } else if (avgRating >= 4.0) {
            score += 5;
            strengths.add("Well Rated");
        }

        score = Math.min(score, 100);

        return new ScoreResult(score, strengths, weaknesses, suggestions);
    }

    private int countProjects(String projectsJson) {
        if (projectsJson == null || projectsJson.isBlank()) return 0;
        try {
            List<Object> projects = objectMapper.readValue(projectsJson, new TypeReference<>() {});
            return projects.size();
        } catch (Exception e) {
            log.warn("Could not parse projects JSON: {}", e.getMessage());
            return 0;
        }
    }
}
