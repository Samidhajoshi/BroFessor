package com.skillify.service;

import com.skillify.dto.NotificationDTO;
import com.skillify.entity.Notification;
import com.skillify.entity.User;
import com.skillify.exception.ApiException;
import com.skillify.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void notify(User user, String message) {
        Notification n = Notification.builder()
                .user(user)
                .message(message)
                .build();
        notificationRepository.save(n);
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getForUser(User user) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(NotificationDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(User user) {
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    @Transactional
    public void markRead(User user, Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException("Notification not found.", HttpStatus.NOT_FOUND));
        if (!n.getUser().getId().equals(user.getId())) {
            throw new ApiException("This notification does not belong to you.", HttpStatus.FORBIDDEN);
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    /** Mark every unread notification for this user as read in one go. */
    @Transactional
    public void markAllRead(User user) {
        List<Notification> unread = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(n -> !n.isRead())
                .toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}