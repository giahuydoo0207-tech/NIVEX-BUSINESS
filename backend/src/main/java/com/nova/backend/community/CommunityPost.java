package com.nova.backend.community;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record CommunityPost(
    UUID id,
    String content,
    List<String> images,
    List<String> topics,
    String privacy,
    boolean isPinned,
    Instant createdAt,
    Instant updatedAt,
    long reactionCount,
    String myReaction,
    Map<String, Long> reactionCounts,
    boolean isSaved,
    boolean isHidden,
    boolean isFollowingAuthor,
    CommunityProfile author,
    List<CommunityComment> comments
) {}
