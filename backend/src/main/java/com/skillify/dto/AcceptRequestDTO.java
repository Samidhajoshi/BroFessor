package com.skillify.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AcceptRequestDTO {

    @NotBlank(message = "scheduledTime is required")
    private String scheduledTime;

    private String meetingLink;
}
