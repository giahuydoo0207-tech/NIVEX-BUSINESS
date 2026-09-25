package com.nova.backend.businessprofile;

import java.time.Instant;
import java.util.UUID;

public record BusinessProfile(
    UUID organizationId,
    String handle,
    String name,
    boolean verified,
    String network,
    String category,
    String bio,
    int followerCount,
    String avatarUrl,
    String coverUrl,
    Instant updatedAt
) {}
