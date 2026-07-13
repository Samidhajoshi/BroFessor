package com.skillify.chat.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory presence store.
 * For horizontal scaling this would be backed by Redis, but for a single
 * instance ConcurrentHashMap is safe and requires no extra infrastructure.
 */
@Service
public class PresenceService {

    // userId -> last-seen timestamp
    private final Map<Long, LocalDateTime> onlineUsers = new ConcurrentHashMap<>();

    public void setOnline(Long userId) {
        onlineUsers.put(userId, LocalDateTime.now());
    }

    public void setOffline(Long userId) {
        onlineUsers.remove(userId);
    }

    public boolean isOnline(Long userId) {
        return onlineUsers.containsKey(userId);
    }

    public LocalDateTime lastSeen(Long userId) {
        return onlineUsers.get(userId);
    }

    public Set<Long> onlineUserIds() {
        return onlineUsers.keySet();
    }
}
