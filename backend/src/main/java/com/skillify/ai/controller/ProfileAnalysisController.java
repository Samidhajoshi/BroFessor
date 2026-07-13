package com.skillify.ai.controller;

import com.skillify.ai.dto.ProfileAnalysisResponse;
import com.skillify.ai.service.ProfileAnalysisService;
import com.skillify.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileAnalysisController {

    private final ProfileAnalysisService analysisService;

    /**
     * POST /api/profile/analyze
     * Runs (or returns cached) analysis for the authenticated user.
     */
    @PostMapping("/analyze")
    public ResponseEntity<ProfileAnalysisResponse> analyze() {
        Long userId = SecurityUtils.currentUser().getId();
        return ResponseEntity.ok(analysisService.analyze(userId));
    }

    /**
     * GET /api/profile/analysis/latest
     * Returns the most recent stored analysis without re-running it.
     */
    @GetMapping("/analysis/latest")
    public ResponseEntity<ProfileAnalysisResponse> latest() {
        Long userId = SecurityUtils.currentUser().getId();
        return analysisService.getLatest(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * GET /api/profile/analysis/history
     * Returns all past analyses for the authenticated user.
     */
    @GetMapping("/analysis/history")
    public ResponseEntity<List<ProfileAnalysisResponse>> history() {
        Long userId = SecurityUtils.currentUser().getId();
        return ResponseEntity.ok(analysisService.getHistory(userId));
    }
}
