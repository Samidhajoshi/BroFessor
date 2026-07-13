package com.skillify.util;

import com.skillify.entity.MeetingProvider;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Validates and detects the provider of a meeting link.
 *
 * <p>Supported providers:
 * <ul>
 *   <li>Google Meet   – https://meet.google.com/xxx-xxxx-xxx</li>
 *   <li>Zoom          – https://zoom.us/j/... or https://*.zoom.us/j/...</li>
 *   <li>Microsoft Teams – https://teams.microsoft.com/l/meetup-join/...</li>
 *   <li>Jitsi         – https://meet.jit.si/RoomName</li>
 * </ul>
 */
@Component
public class MeetingLinkValidator {

    // Google Meet: https://meet.google.com/<room-code>
    private static final Pattern GOOGLE_MEET = Pattern.compile(
            "^https://meet\\.google\\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}$",
            Pattern.CASE_INSENSITIVE
    );

    // Zoom: https://zoom.us/j/<id>[?pwd=...] or https://*.zoom.us/j/<id>
    private static final Pattern ZOOM = Pattern.compile(
            "^https://([a-z0-9-]+\\.)?zoom\\.us/(j|my)/[a-zA-Z0-9?=&%_-]+$",
            Pattern.CASE_INSENSITIVE
    );

    // Microsoft Teams
    private static final Pattern TEAMS = Pattern.compile(
            "^https://teams\\.microsoft\\.com/l/meetup-join/[^\\s]+$",
            Pattern.CASE_INSENSITIVE
    );

    // Jitsi: https://meet.jit.si/<RoomName>
    private static final Pattern JITSI = Pattern.compile(
            "^https://meet\\.jit\\.si/[^\\s/]+$",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * Returns true if the URL is a valid, supported meeting link.
     *
     * <p>Rules checked:
     * <ol>
     *   <li>Not null or blank</li>
     *   <li>Starts with https://</li>
     *   <li>Matches at least one known provider pattern</li>
     * </ol>
     */
    public boolean isValidMeetingLink(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        String trimmed = url.trim();
        if (!trimmed.startsWith("https://")) {
            return false;
        }
        return GOOGLE_MEET.matcher(trimmed).matches()
                || ZOOM.matcher(trimmed).matches()
                || TEAMS.matcher(trimmed).matches()
                || JITSI.matcher(trimmed).matches();
    }

    /**
     * Auto-detects the provider from a URL.
     * Returns {@link MeetingProvider#OTHER} if none matched.
     */
    public MeetingProvider detectProvider(String url) {
        if (url == null || url.isBlank()) {
            return MeetingProvider.OTHER;
        }
        String trimmed = url.trim();
        if (GOOGLE_MEET.matcher(trimmed).matches()) return MeetingProvider.GOOGLE_MEET;
        if (ZOOM.matcher(trimmed).matches())         return MeetingProvider.ZOOM;
        if (TEAMS.matcher(trimmed).matches())        return MeetingProvider.MICROSOFT_TEAMS;
        if (JITSI.matcher(trimmed).matches())        return MeetingProvider.JITSI;
        return MeetingProvider.OTHER;
    }
}
