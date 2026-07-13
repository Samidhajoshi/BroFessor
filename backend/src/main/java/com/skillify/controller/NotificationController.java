package com.skillify.controller;

import com.skillify.dto.NotificationDTO;
import com.skillify.security.SecurityUtils;
import com.skillify.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getAll() {
        return ResponseEntity.ok(notificationService.getForUser(SecurityUtils.currentUser()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        return ResponseEntity.ok(
            Map.of("unreadCount", notificationService.unreadCount(SecurityUtils.currentUser())));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(SecurityUtils.currentUser(), id);
        return ResponseEntity.noContent().build();
    }

    /** Mark all notifications read — called when user opens the notifications page. */
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead() {
        notificationService.markAllRead(SecurityUtils.currentUser());
        return ResponseEntity.noContent().build();
    }
}