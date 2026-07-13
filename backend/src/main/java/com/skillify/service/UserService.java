package com.skillify.service;

import com.skillify.dto.*;
import com.skillify.entity.*;
import com.skillify.exception.ApiException;
import com.skillify.repository.UserRepository;
import com.skillify.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Value("${app.upload.dir}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public UserDTO getById(Long id) {
        return UserDTO.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAll() {
        return userRepository.findAllOrderByAverageRatingDesc()
                .stream().map(UserDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<UserDTO> search(Long currentUserId, String skillWanted) {
        return userRepository.searchBarterUsers(skillWanted)
                .stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .map(UserDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserDTO> searchByName(Long currentUserId, String name) {
        return userRepository.searchByName(name)
                .stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .map(UserDTO::from)
                .toList();
    }

    @Transactional
    public UserDTO updateProfile(User currentUser, ProfileUpdateRequest req) {
        User user = findOrThrow(currentUser.getId());

        if (!user.getEmail().equalsIgnoreCase(req.getEmail())
                && userRepository.existsByEmail(req.getEmail())) {
            throw new ApiException("That email is already in use.", HttpStatus.CONFLICT);
        }

        user.setName(req.getName());
        user.setEmail(req.getEmail());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        user.setAge(req.getAge());
        user.setBio(req.getBio());
        user.setGithubUrl(sanitizeUrl(req.getGithubUrl()));
        user.setLinkedinUrl(sanitizeUrl(req.getLinkedinUrl()));
        user.setWebsiteUrl(sanitizeUrl(req.getWebsiteUrl()));
        user.setLearningPlatforms(req.getLearningPlatforms());
        user.setProjects(req.getProjects());

        user = userRepository.save(user);
        notificationService.notify(user, "Your profile has been updated successfully.");
        return UserDTO.from(user);
    }

    @Transactional
    public UserDTO uploadPhoto(User currentUser, MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ApiException("File must be an image.", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new ApiException("Image must be under 5 MB.", HttpStatus.BAD_REQUEST);
        }

        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);

        String ext = contentType.equals("image/png") ? ".png"
                   : contentType.equals("image/gif") ? ".gif" : ".jpg";
        String filename = "avatar_" + currentUser.getId() + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;

        Path dest = dir.resolve(filename);
        Files.write(dest, file.getBytes());

        User user = findOrThrow(currentUser.getId());
        user.setProfilePhotoUrl("/uploads/" + filename);
        user = userRepository.save(user);

        return UserDTO.from(user);
    }

    @Transactional
    public UserDTO addSkill(User currentUser, AddSkillRequest req) {
        User user = findOrThrow(currentUser.getId());
        SkillType type = SkillType.valueOf(req.getType());

        long existing = user.getSkills().stream()
                .filter(s -> s.getSkillName().equalsIgnoreCase(req.getSkillName().trim()) && s.getType() == type)
                .count();
        if (existing > 0) {
            throw new ApiException("You already have this skill listed.", HttpStatus.CONFLICT);
        }

        UserSkill skill = UserSkill.builder()
                .user(user)
                .skillName(req.getSkillName().trim())
                .type(type)
                .build();
        // Save and get the persisted skill (with generated ID)
        skill = userSkillRepository.save(skill);

        // Fix: add directly to the in-memory collection so the same Hibernate-cached
        // User entity reflects the change — avoids stale 1st-level cache on findById.
        user.getSkills().add(skill);

        // If adding an OFFER skill and still LEARNER, auto-upgrade
        if (type == SkillType.OFFER && user.getUserType() == UserType.LEARNER) {
            user.setUserType(UserType.BARTER_USER);
            userRepository.save(user);
        }

        return UserDTO.from(user);
    }

    @Transactional
    public UserDTO removeSkill(User currentUser, Long skillId) {
        User user = findOrThrow(currentUser.getId());

        UserSkill skill = userSkillRepository.findById(skillId)
                .orElseThrow(() -> new ApiException("Skill not found.", HttpStatus.NOT_FOUND));

        if (!skill.getUser().getId().equals(user.getId())) {
            throw new ApiException("This skill does not belong to you.", HttpStatus.FORBIDDEN);
        }

        // Fix: remove from in-memory collection first so the cached User entity
        // reflects the deletion — avoids stale 1st-level cache on findById.
        user.getSkills().remove(skill);
        userSkillRepository.delete(skill);

        return UserDTO.from(user);
    }

    public User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found.", HttpStatus.NOT_FOUND));
    }

    /** Trims and returns null if blank, otherwise the url as-is. */
    private String sanitizeUrl(String url) {
        if (url == null || url.isBlank()) return null;
        String t = url.trim();
        // ensure it starts with http:// or https://
        if (!t.startsWith("http://") && !t.startsWith("https://")) {
            t = "https://" + t;
        }
        return t;
    }

}