package com.skillify.controller;

import com.skillify.dto.AuthResponse;
import com.skillify.dto.LoginRequest;
import com.skillify.dto.RegisterRequest;
import com.skillify.dto.UserDTO;
import com.skillify.security.SecurityUtils;
import com.skillify.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @GetMapping("/profile")
    public ResponseEntity<UserDTO> profile() {
        return ResponseEntity.ok(UserDTO.from(SecurityUtils.currentUser()));
    }
}
