package com.skillify.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReviewDTO {
    private Long sessionId;
    private Long reviewerId;
    private String reviewerName;
    private String reviewerPhotoUrl;
    private int rating;
    private String review;
    private String skill;
    private String sessionDate;
}

