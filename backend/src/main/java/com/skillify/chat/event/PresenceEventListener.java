package com.skillify.chat.event;

import com.skillify.chat.dto.PresenceEvent;
import com.skillify.chat.service.PresenceService;
import com.skillify.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class PresenceEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final PresenceService presenceService;

    @EventListener
    public void handleConnect(SessionConnectedEvent event) {
        Principal principal = event.getUser();
        if (principal == null) return;

        Long userId = extractUserId(principal);
        String userName = principal.getName();
        if (userId == null) return;

        presenceService.setOnline(userId);
        log.debug("User {} came online", userName);

        messagingTemplate.convertAndSend("/topic/presence",
                PresenceEvent.builder()
                        .userId(userId)
                        .userName(userName)
                        .status("ONLINE")
                        .lastSeen(LocalDateTime.now())
                        .build());
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = sha.getUser();
        if (principal == null) return;

        Long userId = extractUserId(principal);
        String userName = principal.getName();
        if (userId == null) return;

        presenceService.setOffline(userId);
        log.debug("User {} went offline", userName);

        messagingTemplate.convertAndSend("/topic/presence",
                PresenceEvent.builder()
                        .userId(userId)
                        .userName(userName)
                        .status("OFFLINE")
                        .lastSeen(LocalDateTime.now())
                        .build());
    }

    private Long extractUserId(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof UserPrincipal up) {
                return up.getId();
            }
        }
        return null;
    }
}
