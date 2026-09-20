import type {
  CommunityPost,
  PostComment,
  PostCommentReply,
  PostReactionType,
  PublicProfileData,
} from "../types/community.ts";

export const VALID_REACTION_TYPES: PostReactionType[] = [
  "like",
  "love",
  "trust",
  "build",
  "insightful",
  "deal",
  "launch",
];

export function isValidReactionType(val: unknown): val is PostReactionType {
  return typeof val === "string" && VALID_REACTION_TYPES.includes(val as PostReactionType);
}

/**
 * Normalizes and sanitizes a raw post object (e.g. from localStorage).
 * Safely migrates legacy data without reactionCounts:
 * - If raw.reactionCounts is valid: sanitizes and keeps positive counts.
 * - Else if myReaction: seeds { [myReaction]: reactionCount }.
 * - Else if reactionCount > 0: seeds { like: reactionCount }.
 * Maintains invariant: reactionCount === sum(reactionCounts).
 */
export function normalizeCommunityPost(item: unknown): CommunityPost | null {
  if (!item || typeof item !== "object") return null;
  const raw = item as Record<string, unknown>;
  if (typeof raw.id !== "string" || !raw.id) return null;

  const myReaction: PostReactionType | null = isValidReactionType(raw.myReaction)
    ? raw.myReaction
    : null;

  const initialReactionCount =
    typeof raw.reactionCount === "number" && raw.reactionCount >= 0
      ? Math.floor(raw.reactionCount)
      : 0;

  // Hydrate & sanitize reactionCounts
  const rawCounts =
    raw.reactionCounts && typeof raw.reactionCounts === "object"
      ? (raw.reactionCounts as Record<string, unknown>)
      : null;

  const reactionCounts: Partial<Record<PostReactionType, number>> = {};
  if (rawCounts) {
    for (const [key, val] of Object.entries(rawCounts)) {
      if (isValidReactionType(key) && typeof val === "number" && val > 0) {
        reactionCounts[key] = Math.floor(val);
      }
    }
  }

  // If no valid reactionCounts from raw data, migrate from myReaction / reactionCount
  const hasValidRawCounts = Object.keys(reactionCounts).length > 0;
  if (!hasValidRawCounts) {
    if (myReaction) {
      reactionCounts[myReaction] = Math.max(1, initialReactionCount);
    } else if (initialReactionCount > 0) {
      reactionCounts.like = initialReactionCount;
    }
  }

  // Ensure invariant: reactionCount === sum(reactionCounts)
  const sumCounts = Object.values(reactionCounts).reduce((acc, c) => acc + (c || 0), 0);
  const reactionCount = sumCounts > 0 ? sumCounts : initialReactionCount;

  return {
    id: raw.id,
    content: typeof raw.content === "string" ? raw.content : "",
    images: Array.isArray(raw.images)
      ? raw.images.filter((img): img is string => typeof img === "string")
      : [],
    timeLabel: typeof raw.timeLabel === "string" ? raw.timeLabel : "Vừa xong",
    createdAt:
      typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    isMine: Boolean(raw.isMine),
    isPinned: Boolean(raw.isPinned),
    isSaved: Boolean(raw.isSaved),
    isHidden: Boolean(raw.isHidden),
    reactionCount,
    myReaction,
    reactionCounts,
    comments: Array.isArray(raw.comments) ? (raw.comments as PostComment[]) : [],
    topics: Array.isArray(raw.topics)
      ? raw.topics.filter((t): t is string => typeof t === "string")
      : [],
    author:
      raw.author && typeof raw.author === "object"
        ? (raw.author as PublicProfileData)
        : undefined,
    isFollowingAuthor: Boolean(raw.isFollowingAuthor),
    repostCount: typeof raw.repostCount === "number" ? raw.repostCount : 0,
  };
}

/**
 * Determines the layout style based on the number of images.
 * 1: single (full width, max 460px)
 * 2: double (2 columns, 220px)
 * 3: triple (left 3fr, right 2fr stacked, 290px)
 * 4+: quad (2x2 grid, 320px, 4th item overlays +N if count > 4)
 */
export function determineGalleryLayout(count: number): "none" | "single" | "double" | "triple" | "quad" {
  if (count <= 0) return "none";
  if (count === 1) return "single";
  if (count === 2) return "double";
  if (count === 3) return "triple";
  return "quad";
}

/**
 * Returns top reactions (up to 2) sorted by count descending.
 * Ignores reactions with count <= 0.
 */
export function getTopReactions(post: CommunityPost): PostReactionType[] {
  const counts = post.reactionCounts;
  if (counts && typeof counts === "object") {
    const validEntries = Object.entries(counts).filter(
      (entry): entry is [PostReactionType, number] =>
        typeof entry[1] === "number" && entry[1] > 0
    );

    if (validEntries.length > 0) {
      validEntries.sort((a, b) => b[1] - a[1]);
      return validEntries.slice(0, 2).map(([key]) => key);
    }
  }

  // Fallback if reactionCounts is missing or empty
  if (post.myReaction) {
    return [post.myReaction];
  }
  if (post.reactionCount > 0) {
    return ["like"];
  }
  return [];
}

/**
 * Pure function to toggle or switch a reaction on a post.
 * - If user hasn't reacted yet: reactionCount + 1, set myReaction, increment in reactionCounts.
 * - If user clicked the same reaction: reactionCount - 1, unset myReaction, decrement in reactionCounts.
 * - If user switched reaction: reactionCount stays same, decrement old reaction, increment new reaction.
 * Invariant maintained: reactionCount === sum(reactionCounts), no negative counts.
 */
export function togglePostReaction(
  post: CommunityPost,
  reaction: PostReactionType
): CommunityPost {
  const currentReaction = post.myReaction;

  // Hydrate initial counts if missing
  const counts: Partial<Record<PostReactionType, number>> = {};
  if (post.reactionCounts && typeof post.reactionCounts === "object") {
    for (const [key, val] of Object.entries(post.reactionCounts)) {
      if (typeof val === "number" && val > 0) {
        counts[key as PostReactionType] = val;
      }
    }
  } else if (post.myReaction) {
    counts[post.myReaction] = Math.max(1, post.reactionCount);
  } else if (post.reactionCount > 0) {
    counts.like = post.reactionCount;
  }

  let nextMyReaction: PostReactionType | null = null;
  let nextReactionCount = post.reactionCount;

  if (currentReaction === reaction) {
    // 1. Un-react
    nextMyReaction = null;
    nextReactionCount = Math.max(0, post.reactionCount - 1);
    if (counts[reaction]) {
      counts[reaction] = (counts[reaction] || 1) - 1;
      if (counts[reaction]! <= 0) {
        delete counts[reaction];
      }
    }
  } else if (currentReaction == null) {
    // 2. New reaction
    nextMyReaction = reaction;
    nextReactionCount = post.reactionCount + 1;
    counts[reaction] = (counts[reaction] || 0) + 1;
  } else {
    // 3. Changed reaction type
    nextMyReaction = reaction;
    // Decrement old
    if (counts[currentReaction]) {
      counts[currentReaction] = (counts[currentReaction] || 1) - 1;
      if (counts[currentReaction]! <= 0) {
        delete counts[currentReaction];
      }
    }
    // Increment new
    counts[reaction] = (counts[reaction] || 0) + 1;
    // Total reactionCount stays the same
  }

  // Ensure invariant: nextReactionCount matches sum of counts
  const sum = Object.values(counts).reduce((acc, count) => acc + (count || 0), 0);
  nextReactionCount = sum;

  return {
    ...post,
    myReaction: nextMyReaction,
    reactionCount: nextReactionCount,
    reactionCounts: counts,
  };
}

/**
 * Pure function to add a top-level comment to a post.
 */
export function addCommentToPost(
  post: CommunityPost,
  comment: PostComment
): CommunityPost {
  return {
    ...post,
    comments: [comment, ...post.comments],
  };
}

/**
 * Pure function to add a nested reply to a specific comment.
 */
export function addReplyToPost(
  post: CommunityPost,
  parentCommentId: string,
  reply: PostCommentReply
): CommunityPost {
  return {
    ...post,
    comments: post.comments.map((c) => {
      if (c.id === parentCommentId) {
        return {
          ...c,
          replies: [...c.replies, reply],
        };
      }
      return c;
    }),
  };
}

/**
 * Pure function to toggle like on a comment or nested reply.
 */
export function toggleCommentLikeInPost(
  post: CommunityPost,
  targetId: string
): CommunityPost {
  return {
    ...post,
    comments: post.comments.map((c) => {
      if (c.id === targetId) {
        const nextLiked = !c.isLiked;
        return {
          ...c,
          isLiked: nextLiked,
          likeCount: nextLiked ? c.likeCount + 1 : Math.max(0, c.likeCount - 1),
        };
      }

      // Check replies
      const hasReply = c.replies.some((r) => r.id === targetId);
      if (hasReply) {
        return {
          ...c,
          replies: c.replies.map((r) => {
            if (r.id === targetId) {
              const nextLiked = !r.isLiked;
              return {
                ...r,
                isLiked: nextLiked,
                likeCount: nextLiked ? r.likeCount + 1 : Math.max(0, r.likeCount - 1),
              };
            }
            return r;
          }),
        };
      }

      return c;
    }),
  };
}

/**
 * Pure function to toggle pin on a post.
 */
export function togglePostPin(post: CommunityPost): CommunityPost {
  return {
    ...post,
    isPinned: !post.isPinned,
  };
}

/**
 * Pure function to toggle saved state on a post.
 */
export function togglePostSave(post: CommunityPost): CommunityPost {
  return {
    ...post,
    isSaved: !post.isSaved,
  };
}

/**
 * Pure function to hide a post from main feed.
 */
export function hidePost(post: CommunityPost): CommunityPost {
  return {
    ...post,
    isHidden: true,
  };
}

/**
 * Pure function to restore an unhidden post back to main feed.
 */
export function restorePost(post: CommunityPost): CommunityPost {
  return {
    ...post,
    isHidden: false,
  };
}

/**
 * Total comment count including nested replies.
 */
export function calculateTotalComments(comments: PostComment[]): number {
  return comments.reduce((sum, c) => sum + 1 + (c.replies ? c.replies.length : 0), 0);
}
