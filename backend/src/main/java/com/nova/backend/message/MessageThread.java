package com.nova.backend.message;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A conversation between one organization and one talent. {@code unreadForTalent} counts business
 * messages the talent has not opened; {@code unreadForBusiness} counts talent messages the business
 * has not opened.
 */
public record MessageThread(UUID id, String contractorId, String candidateName, String headline, String requestStatus,
    Instant createdAt, Instant acceptedAt, Instant updatedAt, UUID organizationId, String organizationName,
    String candidateAvatarUrl, String organizationAvatarUrl, long unreadForTalent, long unreadForBusiness,
    List<ThreadMessage> messages) {}
