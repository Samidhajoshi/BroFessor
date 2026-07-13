package com.skillify.service;

import com.skillify.dto.*;
import com.skillify.entity.*;
import com.skillify.exception.ApiException;
import com.skillify.repository.UserRepository;
import com.skillify.repository.UserSkillRepository;
import com.skillify.security.JwtUtil;
import com.skillify.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ApiException("An account with this email already exists.", HttpStatus.CONFLICT);
        }

        UserType userType = UserType.valueOf(req.getUserType());

        if (userType == UserType.BARTER_USER &&
                (req.getSkillsOffered() == null || req.getSkillsOffered().isEmpty())) {
            throw new ApiException("Barter users must specify at least one skill they offer.", HttpStatus.BAD_REQUEST);
        }

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .age(req.getAge())
                .bio(req.getBio())
                .userType(userType)
                .points(userType == UserType.LEARNER ? 100 : 50)
                .totalRatingSum(0)
                .totalRatings(0)
                .badge("NONE")
                .skills(new ArrayList<>())
                .build();

        user = userRepository.save(user);

        // Persist skills
        addSkillsToUser(user, req.getSkillsWanted(), SkillType.WANT);
        if (req.getSkillsOffered() != null) {
            addSkillsToUser(user, req.getSkillsOffered(), SkillType.OFFER);
        }

        String token = jwtUtil.generateToken(new UserPrincipal(user));
        return new AuthResponse(token, UserDTO.from(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ApiException("Invalid email or password.", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new ApiException("Invalid email or password.", HttpStatus.UNAUTHORIZED);
        }

        String token = jwtUtil.generateToken(new UserPrincipal(user));

        notificationService.notify(user,
                "Welcome back, " + user.getName() + "! Points: " + user.getPoints() +
                " | Role: " + user.getUserType());

        return new AuthResponse(token, UserDTO.from(user));
    }

    private void addSkillsToUser(User user, List<String> skillNames, SkillType type) {
        if (skillNames == null) return;
        for (String name : skillNames) {
            if (name != null && !name.isBlank()) {
                UserSkill skill = UserSkill.builder()
                        .user(user)
                        .skillName(name.trim())
                        .type(type)
                        .build();
                skill = userSkillRepository.save(skill);
                // Add directly to the in-memory collection so the same Hibernate-cached
                // User entity reflects the change — avoids stale 1st-level cache on findById.
                user.getSkills().add(skill);
            }
        }
    }
}