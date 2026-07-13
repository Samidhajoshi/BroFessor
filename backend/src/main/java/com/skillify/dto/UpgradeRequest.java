package com.skillify.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpgradeRequest {

    @NotBlank(message = "skillOffered is required to upgrade")
    private String skillOffered;
}
