package com.skillify.controller;

import com.skillify.dto.*;
import com.skillify.security.SecurityUtils;
import com.skillify.service.SessionService;
import com.skillify.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SessionService sessionService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAll() {
        return ResponseEntity.ok(userService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<List<ReviewDTO>> getReviews(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getReviewsForUser(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserDTO>> search(@RequestParam String skillWanted) {
        return ResponseEntity.ok(userService.search(SecurityUtils.currentUser().getId(), skillWanted));
    }

    @GetMapping("/search-by-name")
    public ResponseEntity<List<UserDTO>> searchByName(@RequestParam String name) {
        return ResponseEntity.ok(userService.searchByName(SecurityUtils.currentUser().getId(), name));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateProfile(@Valid @RequestBody ProfileUpdateRequest req) {
        return ResponseEntity.ok(userService.updateProfile(SecurityUtils.currentUser(), req));
    }

    @PostMapping("/photo")
    public ResponseEntity<UserDTO> uploadPhoto(@RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(userService.uploadPhoto(SecurityUtils.currentUser(), file));
    }

    @PostMapping("/skills")
    public ResponseEntity<UserDTO> addSkill(@Valid @RequestBody AddSkillRequest req) {
        return ResponseEntity.ok(userService.addSkill(SecurityUtils.currentUser(), req));
    }

    @DeleteMapping("/skills/{skillId}")
    public ResponseEntity<UserDTO> removeSkill(@PathVariable Long skillId) {
        return ResponseEntity.ok(userService.removeSkill(SecurityUtils.currentUser(), skillId));
    }
}
