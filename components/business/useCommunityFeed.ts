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
const liveCommunity = process.env.NEXT_PUBLIC_PAYMENT_MODE === "devnet";

type ApiProfile = { id: string; kind: string; displayName: string; handle: string; headline: string; avatarUrl?: string | null };
type ApiComment = { id: string; content: string; createdAt: string; author: ApiProfile; likeCount: number; isLiked: boolean; replies: ApiComment[] };
type ApiPost = { id: string; content: string; images: string[]; topics: string[]; privacy: string; isPinned: boolean; createdAt: string; reactionCount: number; myReaction?: string | null; reactionCounts?: Record<string, number>; isSaved: boolean; isHidden: boolean; isFollowingAuthor: boolean; author: ApiProfile; comments: ApiComment[] };

function timeLabel(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ`;
  return `${Math.floor(minutes / 1440)} ngày`;
}

function mapProfile(profile: ApiProfile): PublicProfileData {
  return { kind: profile.kind.toLowerCase() === "business" ? "business" : "freelancer", displayName: profile.displayName, handle: profile.handle, headline: profile.headline, location: "", bio: "", tags: [], stats: [], avatarUrl: profile.avatarUrl ?? undefined };
}

function mapComment(comment: ApiComment, replyingToName?: string): PostComment {
  return {
    id: comment.id, authorName: comment.author.displayName, headline: comment.author.headline, content: comment.content,
    timeLabel: timeLabel(comment.createdAt), createdAt: comment.createdAt, avatarUrl: comment.author.avatarUrl ?? undefined,
    isMine: comment.author.id === "nova-labs", likeCount: comment.likeCount, isLiked: comment.isLiked,
    replies: comment.replies.map((reply) => ({ ...mapComment(reply, comment.author.displayName), replyingToName: comment.author.displayName, replies: undefined } as PostCommentReply)),
  };
}

function mapPost(post: ApiPost): CommunityPost {
  const type = (value?: string | null) => {
    const reaction = value?.toLowerCase() as PostReactionType | undefined;
    return ["like", "love", "trust", "build", "insightful", "deal", "launch"].includes(reaction ?? "") ? reaction! : null;
  };
  return {
    id: post.id, content: post.content, images: post.images.map((image) => image.startsWith("/") ? `/api/devnet${image}` : image),
    topics: post.topics, privacy: post.privacy.toLowerCase() as PostPrivacy, isPinned: post.isPinned,
    timeLabel: timeLabel(post.createdAt), createdAt: post.createdAt, isMine: post.author.id === "nova-labs",
    reactionCount: post.reactionCount, myReaction: type(post.myReaction),
    reactionCounts: Object.fromEntries(Object.entries(post.reactionCounts ?? {}).map(([key, value]) => [key.toLowerCase(), value])) as Partial<Record<PostReactionType, number>>,
    isSaved: post.isSaved, isHidden: post.isHidden, isFollowingAuthor: post.isFollowingAuthor,
    author: mapProfile(post.author), comments: post.comments.map((comment) => mapComment(comment)),
  };
}

async function communityRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/devnet/community${path}`, { cache: "no-store", ...options });
  if (!response.ok) throw new Error(`Community API ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

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

  const refreshLivePosts = useCallback(async () => {
    if (!liveCommunity) return;
    const remote = await communityRequest<ApiPost[]>("/posts");
    saveAndBroadcast(remote.map(mapPost));
  }, [saveAndBroadcast]);

  const synchronize = useCallback((operation: () => Promise<unknown>) => {
    if (!liveCommunity) return;
    void operation().then(() => refreshLivePosts()).catch((error) => {
      console.error("Community API request failed:", error);
    });
  }, [refreshLivePosts]);

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

  useEffect(() => {
    if (!liveCommunity) return;
    void refreshLivePosts().catch(() => undefined);
  }, [refreshLivePosts]);

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
      synchronize(() => communityRequest("/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPost.content || "Ảnh mới",
          images: images.map((image) => image.replace("/api/devnet", "")),
          topics,
          privacy: "public",
        }),
      }));
      return newPost;
    },
    [posts, saveAndBroadcast, synchronize]
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
      synchronize(() => communityRequest(`/posts/${postId}/reaction`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reaction }),
      }));
    },
    [posts, saveAndBroadcast, synchronize]
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
      synchronize(() => communityRequest(`/posts/${postId}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }),
      }));
    },
    [posts, saveAndBroadcast, synchronize]
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
      synchronize(() => communityRequest(`/posts/${postId}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, parentCommentId }),
      }));
    },
    [posts, saveAndBroadcast, synchronize]
  );

  const toggleCommentLike = useCallback(
    (postId: string, targetId: string) => {
      const target = posts.find((post) => post.id === postId)?.comments
        .flatMap((comment) => [comment, ...comment.replies])
        .find((comment) => comment.id === targetId);
      const nextPosts = posts.map((post) => {
        if (post.id === postId) {
          return toggleCommentLikeInPost(post, targetId);
        }
        return post;
      });
      saveAndBroadcast(nextPosts);
      synchronize(() => communityRequest(`/posts/${postId}/comments/${targetId}/liked`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !target?.isLiked }),
      }));
    },
    [posts, saveAndBroadcast, synchronize]
  );

  const togglePin = useCallback(
    (postId: string) => {
      const current = posts.find((post) => post.id === postId);
      const nextPosts = posts.map((post) => {
        if (post.id === postId) {
          return togglePinUtil(post);
        }
        return post;
      });
      saveAndBroadcast(nextPosts);
      if (current) synchronize(() => communityRequest(`/posts/${postId}/pin`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !current.isPinned }),
      }));
    },
    [posts, saveAndBroadcast, synchronize]
  );

  const toggleSave = useCallback(
    (postId: string) => {
      const current = posts.find((post) => post.id === postId);
      const nextPosts = posts.map((post) => {
        if (post.id === postId) {
          return toggleSaveUtil(post);
        }
        return post;
      });
      saveAndBroadcast(nextPosts);
      if (current) synchronize(() => communityRequest(`/posts/${postId}/saved`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !current.isSaved }),
      }));
    },
    [posts, saveAndBroadcast, synchronize]
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
      synchronize(() => communityRequest(`/posts/${postId}/hidden`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: true }),
      }));
    },
    [posts, saveAndBroadcast, synchronize]
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
      synchronize(() => communityRequest(`/posts/${postId}/hidden`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: false }),
      }));
    },
    [posts, saveAndBroadcast, synchronize]
  );

  const toggleFollowAuthor = useCallback(
    (handle: string) => {
      const isFollowed = followedHandles.includes(handle);
      const nextHandles = isFollowed
        ? followedHandles.filter((h) => h !== handle)
        : [...followedHandles, handle];
      saveFollowedAndBroadcast(nextHandles);
      synchronize(() => communityRequest(`/profiles/${handle}/following`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !isFollowed }),
      }));
    },
    [followedHandles, saveFollowedAndBroadcast, synchronize]
  );

  const deletePost = useCallback(
    (postId: string) => {
      const nextPosts = posts.filter((p) => p.id !== postId);
      saveAndBroadcast(nextPosts);
      synchronize(() => communityRequest(`/posts/${postId}`, { method: "DELETE" }));
    },
    [posts, saveAndBroadcast, synchronize]
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
      synchronize(() => communityRequest(`/profiles/${authorHandle}/blocked`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: true }),
      }));
    },
    [blockedHandles, followedHandles, saveBlockedAndBroadcast, saveFollowedAndBroadcast, synchronize]
  );

  const unblockUser = useCallback(
    (authorHandle: string) => {
      const nextBlocked = blockedHandles.filter((h) => h !== authorHandle);
      saveBlockedAndBroadcast(nextBlocked);
      synchronize(() => communityRequest(`/profiles/${authorHandle}/blocked`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: false }),
      }));
    },
    [blockedHandles, saveBlockedAndBroadcast, synchronize]
  );

  const uploadPostImage = useCallback(async (file: File) => {
    if (!liveCommunity) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Không thể đọc ảnh."));
        reader.onerror = () => reject(new Error("Không thể đọc ảnh."));
        reader.readAsDataURL(file);
      });
    }
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/devnet/community/media", { method: "POST", body: form });
    if (!response.ok) throw new Error("Không thể tải ảnh lên. Ảnh phải là PNG, JPEG hoặc WebP dưới 5 MB.");
    const result = await response.json() as { url: string };
    return `/api/devnet${result.url}`;
  }, []);

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
      const current = posts.find((post) => post.id === postId);
      if (current) synchronize(() => communityRequest(`/posts/${postId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, topics: topics ?? current.topics ?? [], privacy: current.privacy ?? "public" }),
      }));
    },
    [posts, saveAndBroadcast, synchronize]
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
      synchronize(() => communityRequest(`/posts/${postId}/privacy`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ privacy }),
      }));
    },
    [posts, saveAndBroadcast, synchronize]
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
    uploadPostImage,
  };
}
