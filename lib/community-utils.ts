import type { CommunityPost, PostComment, PostCommentReply, PostReactionType } from "../types/community.ts";

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
 * Pure function to toggle or switch a reaction on a post.
 * - If user hasn't reacted yet: reactionCount + 1, set myReaction.
 * - If user clicked the same reaction: reactionCount - 1, unset myReaction.
 * - If user switched reaction: reactionCount stays same, set new myReaction.
 */
export function togglePostReaction(
  post: CommunityPost,
  reaction: PostReactionType
): CommunityPost {
  const currentReaction = post.myReaction;

  if (currentReaction === reaction) {
    // Un-react
    return {
      ...post,
      myReaction: null,
      reactionCount: Math.max(0, post.reactionCount - 1),
    };
  }

  if (currentReaction == null) {
    // New reaction
    return {
      ...post,
      myReaction: reaction,
      reactionCount: post.reactionCount + 1,
    };
  }

  // Changed reaction type
  return {
    ...post,
    myReaction: reaction,
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
