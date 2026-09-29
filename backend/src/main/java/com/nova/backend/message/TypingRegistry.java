package com.nova.backend.message;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * Ephemeral "is typing" state, polled by clients. Kept in memory on purpose: it is only
 * meaningful for a few seconds and is not worth persisting. With several backend
 * instances a client may miss an indicator, which is acceptable.
 */
@Component
public class TypingRegistry {
    static final Duration WINDOW = Duration.ofSeconds(6);
    private final Map<String, Instant> lastTyping = new ConcurrentHashMap<>();

    public void mark(UUID threadId, String senderType) {
        Instant now = Instant.now();
        lastTyping.put(key(threadId, senderType), now);
        if (lastTyping.size() > 10_000) lastTyping.values().removeIf(at -> at.isBefore(now.minus(WINDOW)));
    }

    public void clear(UUID threadId, String senderType) {
        lastTyping.remove(key(threadId, senderType));
    }

    public boolean isTyping(UUID threadId, String senderType) {
        Instant at = lastTyping.get(key(threadId, senderType));
        return at != null && at.isAfter(Instant.now().minus(WINDOW));
    }

    private static String key(UUID threadId, String senderType) {
        return threadId + ":" + senderType;
    }
}
