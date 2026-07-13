package com.skillify.dto;

import lombok.Data;

@Data
public class UpdateSessionRequest {
    private String scheduledTime;
    private String meetingLink;
}
