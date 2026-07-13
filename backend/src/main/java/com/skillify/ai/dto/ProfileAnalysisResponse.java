package com.skillify.ai.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ProfileAnalysisResponse {
    private Long id;
    private int profileScore;
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> suggestions;
    private String aiFeedback;
    private LocalDateTime createdAt;
    private boolean cached;
}
