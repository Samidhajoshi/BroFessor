package com.skillify.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @Min(value = 0, message = "Age cannot be negative")
    private int age;

    private String bio;

    @NotNull(message = "skillsWanted is required")
    @Size(min = 1, message = "You must specify at least one skill you want to learn")
    private List<String> skillsWanted;

    /** Empty list is acceptable for LEARNER accounts */
    private List<String> skillsOffered;

    @NotBlank(message = "User type is required")
    @Pattern(regexp = "LEARNER|BARTER_USER", message = "userType must be LEARNER or BARTER_USER")
    private String userType;
}
