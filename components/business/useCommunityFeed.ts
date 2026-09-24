"use client";

import { useCallback, useEffect, useState } from "react";
import { CommunityPost, PostComment, PostCommentReply, PostPrivacy, PostReactionType, PublicProfileData } from "@/types/community";
import { INITIAL_DEMO_POSTS } from "@/lib/community-constants";
import {
  addCommentToPost,
  addReplyToPost,
  hidePost as hidePostUtil,
  normalizeCommunityPost,
  restorePost as restorePostUtil,
  toggleCommentLikeInPost,
  togglePostPin as togglePinUtil,
  togglePostReaction as toggleReactionUtil,
  togglePostSave as toggleSaveUtil,
} from "@/lib/community-utils";

const COMMUNITY_POSTS_STORAGE_KEY = "nivex.demo.community_posts";
const COMMUNITY_UPDATE_EVENT = "nova:community-updated";
const FOLLOWED_AUTHORS_STORAGE_KEY = "nivex.demo.community_followed_authors";
const FOLLOWED_UPDATE_EVENT = "nova:community-followed-updated";
const BLOCKED_AUTHORS_STORAGE_KEY = "nivex.demo.community_blocked_authors";
const BLOCKED_UPDATE_EVENT = "nova:community-blocked-updated";

function loadStoredPosts(): CommunityPost[] {
  if (typeof window === "undefined") return INITIAL_DEMO_POSTS;
  try {
    const raw = localStorage.getItem(COMMUNITY_POSTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        COMMUNITY_POSTS_STORAGE_KEY,
        JSON.stringify(INITIAL_DEMO_POSTS)
      );
      return INITIAL_DEMO_POSTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_DEMO_POSTS;
    }
    const sanitized = parsed
      .map(normalizeCommunityPost)
      .filter((p): p is CommunityPost => p !== null);
    return sanitized.length > 0 ? sanitized : INITIAL_DEMO_POSTS;
  } catch (err) {
    console.error("Failed to read community posts from localStorage:", err);
    return INITIAL_DEMO_POSTS;
  }
}

function loadFollowedAuthors(): string[] {
  const defaultFollowed = ["baolong.pm"];
  if (typeof window === "undefined") return defaultFollowed;
  try {
    const raw = localStorage.getItem(FOLLOWED_AUTHORS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        FOLLOWED_AUTHORS_STORAGE_KEY,
        JSON.stringify(defaultFollowed)
      );
      return defaultFollowed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultFollowed;
  } catch {
    return defaultFollowed;
  }
}

function loadBlockedAuthors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BLOCKED_AUTHORS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useCommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_DEMO_POSTS);
  const [followedHandles, setFollowedHandles] = useState<string[]>([]);
  const [blockedHandles, setBlockedHandles] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync helper
  const saveAndBroadcast = useCallback((updatedPosts: CommunityPost[]) => {
    setPosts(updatedPosts);
    try {
      localStorage.setItem(
        COMMUNITY_POSTS_STORAGE_KEY,
        JSON.stringify(updatedPosts)
      );
      window.dispatchEvent(new CustomEvent(COMMUNITY_UPDATE_EVENT));
    } catch (err) {
      console.error("Failed to persist community posts:", err);
    }
  }, []);

  const saveFollowedAndBroadcast = useCallback((updatedHandles: string[]) => {
    setFollowedHandles(updatedHandles);
    try {
      localStorage.setItem(
        FOLLOWED_AUTHORS_STORAGE_KEY,
        JSON.stringify(updatedHandles)
      );
      window.dispatchEvent(new CustomEvent(FOLLOWED_UPDATE_EVENT));
    } catch (err) {
      console.error("Failed to persist followed authors:", err);
    }
  }, []);

  const saveBlockedAndBroadcast = useCallback((updatedHandles: string[]) => {
    setBlockedHandles(updatedHandles);
    try {
      localStorage.setItem(
        BLOCKED_AUTHORS_STORAGE_KEY,
        JSON.stringify(updatedHandles)
      );
      window.dispatchEvent(new CustomEvent(BLOCKED_UPDATE_EVENT));
    } catch (err) {
      console.error("Failed to persist blocked authors:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setPosts(loadStoredPosts());
    setFollowedHandles(loadFollowedAuthors());
    setBlockedHandles(loadBlockedAuthors());
    setIsLoaded(true);
  }, []);

  // Listeners for storage changes
  useEffect(() => {
    const handlePostsSync = () => {
      setPosts(loadStoredPosts());
    };
    const handleFollowSync = () => {
      setFollowedHandles(loadFollowedAuthors());
    };
    const handleBlockedSync = () => {
      setBlockedHandles(loadBlockedAuthors());
    };

    window.addEventListener("storage", handlePostsSync);
    window.addEventListener(COMMUNITY_UPDATE_EVENT, handlePostsSync);
    window.addEventListener(FOLLOWED_UPDATE_EVENT, handleFollowSync);
    window.addEventListener(BLOCKED_UPDATE_EVENT, handleBlockedSync);

    return () => {
      window.removeEventListener("storage", handlePostsSync);
      window.removeEventListener(COMMUNITY_UPDATE_EVENT, handlePostsSync);
      window.removeEventListener(FOLLOWED_UPDATE_EVENT, handleFollowSync);
      window.removeEventListener(BLOCKED_UPDATE_EVENT, handleBlockedSync);
    };
  }, []);

  // Actions
  const publishPost = useCallback(
    (content: string, images: string[], topics: string[] = []) => {
      const newPost: CommunityPost = {
        id: `post-mine-${Date.now()}`,
        content: content.trim(),
        images,
        topics,
        timeLabel: "Vừa xong",
        createdAt: new Date().toISOString(),
        isMine: true,
        reactionCount: 0,
        myReaction: null,
        comments: [],
      };

      const nextPosts = [newPost, ...posts];
      saveAndBroadcast(nextPosts);
      return newPost;
    },
    [posts, saveAndBroadcast]
  );

  const reactToPost = useCallback(
    (postId: string, reaction: PostReactionType) => {
      const nextPosts = posts.map((post) => {
        if (post.id === postId) {
          return toggleReactionUtil(post, reaction);
        }
        return post;
      });
      saveAndBroadcast(nextPosts);
    },
    [posts, saveAndBroadcast]
  );

  const addComment = useCallback(
    (postId: string, content: string) => {
      const newComment: PostComment = {
        id: `comment-${Date.now()}`,
        authorName: "Nova Labs",
        headline: "Fintech · Web3 · Remote-first",
        content: content.trim(),
        timeLabel: "Vừa xong",
        createdAt: new Date().toISOString(),
        isMine: true,
        likeCount: 0,
        isLiked: false,
        replies: [],
      };

      const nextPosts = posts.map((post) => {
        if (post.id === postId) {
          return addCommentToPost(post, newComment);
        }
        return post;
      });
      saveAndBroadcast(nextPosts);
    },
    [posts, saveAndBroadcast]
  );

  const addReply = useCallback(
    (postId: string, parentCommentId: string, content: string, replyingToName?: string) => {
      const newReply: PostCommentReply = {
        id: `reply-${Date.now()}`,
        authorName: "Nova Labs",
        headline: "Fintech · Web3 · Remote-first",
        content: content.trim(),
        timeLabel: "Vừa xong",
        createdAt: new Date().toISOString(),
        replyingToName,
        isMine: true,
        likeCount: 0,
        isLiked: false,
      };

      const nextPosts = posts.map((post) => {
        if (post.id === postId) {
          return addReplyToPost(post, parentCommentId, newReply);
        }
        return post;
      });
      saveAndBroadcast(nextPosts);
    },
    [posts, saveAndBroadcast]
  );

  const toggleCommentLike = useCallback(
    (postId: string, targetId: string) => {
      const nextPosts = posts.map((post) => {
        if (post.id === postId) {
          return toggleCommentLikeInPost(post, targetId);
        }
        return post;
      });
      saveAndBroadcast(nextPosts);
    },
    [posts, saveAndBroadcast]
  );

  const togglePin = useCallback(
    (postId: string) => {
      const nextPosts = posts.map((post) => {
        if (post.id === postId) {
          return togglePinUtil(post);
        }
        return post;
      });
      saveAndBroadcast(nextPosts);
    },
    [posts, saveAndBroadcast]
  );

  const toggleSave = useCallback(
    (postId: string) => {
      const nextPosts = posts.map((post) => {
        if (post.id === postId) {
          return toggleSaveUtil(post);
        }
        return post;
      });
      saveAndBroadcast(nextPosts);
    },
    [posts, saveAndBroadcast]
  );

  const hidePost = useCallback(
    (postId: string) => {
      const nextPosts = posts.map((post) => {
        if (post.id === postId) {
          return hidePostUtil(post);
        }
        return post;
      });
      saveAndBroadcast(nextPosts);
    },
    [posts, saveAndBroadcast]
  );

  const restorePost = useCallback(
    (postId: string) => {
      const nextPosts = posts.map((post) => {
        if (post.id === postId) {
          return restorePostUtil(post);
        }
        return post;
      });
      saveAndBroadcast(nextPosts);
    },
    [posts, saveAndBroadcast]
  );

  const toggleFollowAuthor = useCallback(
    (handle: string) => {
      const isFollowed = followedHandles.includes(handle);
      const nextHandles = isFollowed
        ? followedHandles.filter((h) => h !== handle)
        : [...followedHandles, handle];
      saveFollowedAndBroadcast(nextHandles);
    },
    [followedHandles, saveFollowedAndBroadcast]
  );

  const deletePost = useCallback(
    (postId: string) => {
      const nextPosts = posts.filter((p) => p.id !== postId);
      saveAndBroadcast(nextPosts);
    },
    [posts, saveAndBroadcast]
  );

  const blockUser = useCallback(
    (authorHandle: string) => {
      if (!authorHandle) return;
      const nextBlocked = blockedHandles.includes(authorHandle)
        ? blockedHandles
        : [...blockedHandles, authorHandle];
      saveBlockedAndBroadcast(nextBlocked);

      // Remove from followed list if currently followed
      if (followedHandles.includes(authorHandle)) {
        const nextFollowed = followedHandles.filter((h) => h !== authorHandle);
        saveFollowedAndBroadcast(nextFollowed);
      }
    },
    [blockedHandles, followedHandles, saveBlockedAndBroadcast, saveFollowedAndBroadcast]
  );

  const unblockUser = useCallback(
    (authorHandle: string) => {
      const nextBlocked = blockedHandles.filter((h) => h !== authorHandle);
      saveBlockedAndBroadcast(nextBlocked);
    },
    [blockedHandles, saveBlockedAndBroadcast]
  );

  const editPost = useCallback(
    (postId: string, content: string, topics?: string[]) => {
      const nextPosts = posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            content: content.trim(),
            ...(topics !== undefined ? { topics } : {}),
          };
        }
        return post;
      });
      saveAndBroadcast(nextPosts);
    },
    [posts, saveAndBroadcast]
  );

  const updatePostPrivacy = useCallback(
    (postId: string, privacy: PostPrivacy) => {
      const nextPosts = posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            privacy,
          };
        }
        return post;
      });
      saveAndBroadcast(nextPosts);
    },
    [posts, saveAndBroadcast]
  );

  return {
    posts,
    followedHandles,
    blockedHandles,
    isLoaded,
    publishPost,
    reactToPost,
    addComment,
    addReply,
    toggleCommentLike,
    togglePin,
    toggleSave,
    hidePost,
    restorePost,
    toggleFollowAuthor,
    deletePost,
    blockUser,
    unblockUser,
    editPost,
    updatePostPrivacy,
  };
}
