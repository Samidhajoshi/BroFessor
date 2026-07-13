package com.skillify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendRequestDTO {

    @NotNull(message = "receiverId is required")
    private Long receiverId;

    @NotBlank(message = "skillWanted is required")
    private String skillWanted;

    private String comment;
}
