package com.nova.backend.community;

public record CommunityProfile(
    String id,
    String kind,
    String displayName,
    String handle,
    String headline,
    String avatarUrl
) {}
