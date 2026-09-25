package com.nova.backend.community;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CommunityComment(
    UUID id,
    UUID parentCommentId,
    String content,
    Instant createdAt,
    CommunityProfile author,
    long likeCount,
    boolean isLiked,
    List<CommunityComment> replies
) {}
