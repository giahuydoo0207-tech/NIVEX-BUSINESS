package com.nova.backend.community;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record CommunityComment(
    UUID id,
    UUID parentCommentId,
    String content,
    Instant createdAt,
    CommunityProfile author,
    long likeCount,
    boolean isLiked,
    String myReaction,
    Map<String, Long> reactionCounts,
    List<CommunityComment> replies
) {}
