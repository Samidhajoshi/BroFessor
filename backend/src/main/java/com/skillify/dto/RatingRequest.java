package com.skillify.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class RatingRequest {

    // 1-100 scale — badge thresholds (GOLD > 70, SILVER > 50, BRONZE > 40) depend on this range
    @Min(value = 1, message = "Rating must be between 1 and 100")
    @Max(value = 100, message = "Rating must be between 1 and 100")
    private int rating;

    // Optional written feedback
    private String review;
}
