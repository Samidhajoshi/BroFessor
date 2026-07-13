package com.skillify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AddSkillRequest {

    @NotBlank(message = "Skill name is required")
    private String skillName;

    @NotNull(message = "Type is required")
    @Pattern(regexp = "OFFER|WANT", message = "Type must be OFFER or WANT")
    private String type;
}
