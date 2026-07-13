package com.skillify.controller;

import com.skillify.dto.CreateSessionRequest;
import com.skillify.dto.RatingRequest;
import com.skillify.dto.SessionDTO;
import com.skillify.dto.UpdateSessionRequest;
import com.skillify.security.SecurityUtils;
import com.skillify.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    // ── Scheduling ────────────────────────────────────────────────────────

    /** Create a new session from an accepted SkillRequest. */
    @PostMapping
    public ResponseEntity<SessionDTO> create(@Valid @RequestBody CreateSessionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sessionService.createSession(SecurityUtils.currentUser(), req));
    }

    /** Update scheduled time or meeting link (host only). */
    @PutMapping("/{id}")
    public ResponseEntity<SessionDTO> update(
            @PathVariable Long id,
            @RequestBody UpdateSessionRequest req) {
        return ResponseEntity.ok(sessionService.updateSession(SecurityUtils.currentUser(), id, req));
    }

    /** Cancel a session (either participant). */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<SessionDTO> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.cancelSession(SecurityUtils.currentUser(), id));
    }

    /** Delete a cancelled session (host only). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        sessionService.deleteSession(SecurityUtils.currentUser(), id);
        return ResponseEntity.noContent().build();
    }

    // ── Read ──────────────────────────────────────────────────────────────

    @GetMapping("/my-sessions")
    public ResponseEntity<List<SessionDTO>> mySessions() {
        return ResponseEntity.ok(sessionService.getMySessions(SecurityUtils.currentUser()));
    }

    /** Alias kept for backward-compatibility with existing frontend. */
    @GetMapping
    public ResponseEntity<List<SessionDTO>> mySessionsAlias() {
        return ResponseEntity.ok(sessionService.getMySessions(SecurityUtils.currentUser()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getById(SecurityUtils.currentUser(), id));
    }

    // ── Lifecycle (existing) ──────────────────────────────────────────────

    @PostMapping("/{id}/complete")
    public ResponseEntity<SessionDTO> complete(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.complete(SecurityUtils.currentUser(), id));
    }

    @PostMapping("/{id}/rate")
    public ResponseEntity<SessionDTO> rate(@PathVariable Long id, @Valid @RequestBody RatingRequest req) {
        return ResponseEntity.ok(
                sessionService.submitRating(SecurityUtils.currentUser(), id, req.getRating(), req.getReview()));
    }
}
