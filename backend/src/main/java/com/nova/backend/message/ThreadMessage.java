package com.nova.backend.message;

import java.time.Instant;
import java.util.UUID;

public record ThreadMessage(UUID id, String senderType, String body, Instant sentAt, Instant deliveredAt, Instant seenAt) {}
