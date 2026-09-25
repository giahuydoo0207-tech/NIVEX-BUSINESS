package com.nova.backend.community;

import java.time.Instant;

public record CommunityReaction(
    String reaction,
    CommunityProfile actor,
    Instant createdAt
) {}
