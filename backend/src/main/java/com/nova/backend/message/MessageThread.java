package com.nova.backend.message;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MessageThread(UUID id, String contractorId, String candidateName, String headline, String requestStatus,
    Instant createdAt, Instant acceptedAt, Instant updatedAt, List<ThreadMessage> messages) {}
