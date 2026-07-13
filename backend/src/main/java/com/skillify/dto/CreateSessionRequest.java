package com.skillify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateSessionRequest {

    /** ID of the accepted SkillRequest that links both participants. */
    @NotNull(message = "sessionRequestId is required")
    private Long sessionRequestId;

    @NotBlank(message = "scheduledTime is required (ISO-8601, e.g. 2025-08-10T14:30:00)")
    private String scheduledTime;

    /** Valid https:// meeting URL (Google Meet / Zoom / Teams / Jitsi). */
    @NotBlank(message = "meetingLink is required")
    private String meetingLink;
}
