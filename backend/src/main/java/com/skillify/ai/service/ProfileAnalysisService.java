package com.skillify.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillify.ai.dto.ProfileAnalysisResponse;
import com.skillify.ai.entity.ProfileAnalysis;
import com.skillify.ai.repository.ProfileAnalysisRepository;
import com.skillify.entity.User;
import com.skillify.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileAnalysisService {

    private final ProfileAnalysisRepository analysisRepository;
    private final ProfileScoreService       scoreService;
    private final GroqService               groqService;
    private final UserRepository            userRepository;
    private final ObjectMapper              objectMapper;

    // ── Public API ───────────────────────────────────────────────────────

    /** Analyze (or return cached result) for the current user. */
    @Transactional
    public ProfileAnalysisResponse analyze(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String currentHash = hashProfile(user);

        Optional<ProfileAnalysis> cached = analysisRepository
                .findTopByUserIdOrderByCreatedAtDesc(userId);

        // Return cache if profile unchanged and analysed within 24 h
        if (cached.isPresent()) {
            ProfileAnalysis ca = cached.get();
            boolean sameHash   = currentHash.equals(ca.getProfileHash());
            boolean recentEnough = ca.getCreatedAt().isAfter(LocalDateTime.now().minusHours(24));
            if (sameHash && recentEnough) {
                log.info("Returning cached analysis for user {}", userId);
                return toResponse(ca, true);
            }
        }

        // Run rule-based scoring
        ProfileScoreService.ScoreResult result = scoreService.analyze(user);

        // Call Groq for the narrative (compact prompt, 150-token cap)
        String aiFeedback = groqService.generateFeedback(
                result.score(), result.strengths(), result.weaknesses(), result.suggestions());

        // Persist
        ProfileAnalysis analysis = ProfileAnalysis.builder()
                .userId(userId)
                .profileScore(result.score())
                .strengths(toJson(result.strengths()))
                .weaknesses(toJson(result.weaknesses()))
                .suggestions(toJson(result.suggestions()))
                .aiFeedback(aiFeedback)
                .profileHash(currentHash)
                .build();

        analysis = analysisRepository.save(analysis);
        log.info("Saved new analysis for user {} (score={})", userId, result.score());
        return toResponse(analysis, false);
    }

    /** Latest stored analysis — no re-analysis. */
    @Transactional(readOnly = true)
    public Optional<ProfileAnalysisResponse> getLatest(Long userId) {
        return analysisRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .map(a -> toResponse(a, true));
    }

    /** Full analysis history. */
    @Transactional(readOnly = true)
    public List<ProfileAnalysisResponse> getHistory(Long userId) {
        return analysisRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(a -> toResponse(a, true)).toList();
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private ProfileAnalysisResponse toResponse(ProfileAnalysis a, boolean cached) {
        return ProfileAnalysisResponse.builder()
                .id(a.getId())
                .profileScore(a.getProfileScore())
                .strengths(fromJson(a.getStrengths()))
                .weaknesses(fromJson(a.getWeaknesses()))
                .suggestions(fromJson(a.getSuggestions()))
                .aiFeedback(a.getAiFeedback())
                .createdAt(a.getCreatedAt())
                .cached(cached)
                .build();
    }

    private String toJson(List<String> list) {
        try { return objectMapper.writeValueAsString(list); }
        catch (Exception e) { return "[]"; }
    }

    private List<String> fromJson(String json) {
        if (json == null) return List.of();
        try { return objectMapper.readValue(json, new TypeReference<>() {}); }
        catch (Exception e) { return List.of(); }
    }

    /**
     * SHA-256 of the profile fields that affect scoring.
     * Changes → cache invalidated → fresh analysis triggered.
     */
    private String hashProfile(User user) {
        String raw = String.join("|",
                nvl(user.getBio()),
                nvl(user.getGithubUrl()),
                nvl(user.getLinkedinUrl()),
                nvl(user.getProjects()),
                String.valueOf(user.getSkills().size()),
                String.valueOf(user.getTotalRatings()),
                String.valueOf(user.getTotalRatingSum())
        );
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest).substring(0, 32);
        } catch (Exception e) {
            return String.valueOf(raw.hashCode());
        }
    }

    private String nvl(String s) { return s == null ? "" : s; }
}
