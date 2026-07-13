package com.skillify.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProfileUpdateRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    /** Leave blank to keep current password */
    private String password;

    private int age;

    private String bio;

    // ── Social & learning links ───────────────────────────────────────────
    private String githubUrl;
    private String linkedinUrl;
    private String websiteUrl;

    /** Comma-separated list of other platform URLs */
    private String learningPlatforms;

    // ── Projects ─────────────────────────────────────────────────────────
    /** JSON string: [{"title":"…","description":"…","url":"…","tags":[…]}] */
    private String projects;
}
