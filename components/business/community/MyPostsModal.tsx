"use client";

import { useMemo, useState } from "react";
import { CommunityPost, PostReactionType } from "@/types/community";
import {
  Bookmark,
  Building2,
  EyeOff,
  FileText,
  ImageIcon,
  RotateCcw,
  User,
  X,
} from "lucide-react";
import { PostCard } from "./PostCard";

interface MyPostsModalProps {
  posts: CommunityPost[];
  isOpen: boolean;
  onClose: () => void;
  onReact: (postId: string, reaction: PostReactionType) => void;
  onOpenComments: (post: CommunityPost) => void;
  onTogglePin: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onHide: (postId: string) => void;
  onRestore: (postId: string) => void;
  onToggleFollow: (handle: string) => void;
  onShowNotice: (msg: string) => void;
}

type TabKey = "published" | "saved" | "hidden";

export function MyPostsModal({
  posts,
  isOpen,
  onClose,
  onReact,
  onOpenComments,
  onTogglePin,
  onToggleSave,
  onHide,
  onRestore,
  onToggleFollow,
  onShowNotice,
}: MyPostsModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("published");

  const publishedPosts = useMemo(() => {
    return posts
      .filter((p) => p.isMine && !p.isHidden)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [posts]);

  const savedPosts = useMemo(() => {
    return posts
      .filter((p) => p.isSaved)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [posts]);

  const hiddenPosts = useMemo(() => {
    return posts
      .filter((p) => p.isMine && p.isHidden)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [posts]);

  if (!isOpen) return null;

  return (
    <div className="comment-modal-backdrop" onClick={onClose}>
      <div
        className="my-posts-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="my-posts-header">
          <div>
            <h2 className="my-posts-title">Bài đăng của tôi</h2>
            <p className="my-posts-subtitle">
              Quản lý lịch sử, bài đã lưu và bài ẩn
            </p>
          </div>
          <button
            type="button"
            className="comment-modal-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* 3 Stat Counters */}
        <div className="my-posts-stats-row">
          <div className="my-posts-stat-card">
            <span className="stat-label">Đã đăng</span>
            <span className="stat-value">{publishedPosts.length}</span>
          </div>
          <div className="my-posts-stat-card">
            <span className="stat-label">Đã lưu</span>
            <span className="stat-value">{savedPosts.length}</span>
          </div>
          <div className="my-posts-stat-card">
            <span className="stat-label">Đã ẩn</span>
            <span className="stat-value">{hiddenPosts.length}</span>
          </div>
        </div>

        {/* 3 Tabs */}
        <div className="my-posts-tabs-bar">
          <button
            type="button"
            className={`my-posts-tab-btn ${
              activeTab === "published" ? "active" : ""
            }`}
            onClick={() => setActiveTab("published")}
          >
            <span>Đã đăng</span>
            {publishedPosts.length > 0 && (
              <span className="tab-count-badge">{publishedPosts.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`my-posts-tab-btn ${
              activeTab === "saved" ? "active" : ""
            }`}
            onClick={() => setActiveTab("saved")}
          >
            <span>Đã lưu</span>
            {savedPosts.length > 0 && (
              <span className="tab-count-badge">{savedPosts.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`my-posts-tab-btn ${
              activeTab === "hidden" ? "active" : ""
            }`}
            onClick={() => setActiveTab("hidden")}
          >
            <span>Đã ẩn</span>
            {hiddenPosts.length > 0 && (
              <span className="tab-count-badge">{hiddenPosts.length}</span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="my-posts-list-body">
          {activeTab === "published" && (
            <div>
              {publishedPosts.length === 0 ? (
                <div className="empty-tab-state">
                  <div className="empty-tab-icon-wrap">
                    <FileText size={28} />
                  </div>
                  <h4 className="empty-tab-title">Chưa có bài đăng nào</h4>
                  <p className="empty-tab-sub">
                    Các bài đăng bạn chia sẻ với cộng đồng sẽ xuất hiện tại đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publishedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onReact={onReact}
                      onOpenComments={onOpenComments}
                      onTogglePin={onTogglePin}
                      onToggleSave={onToggleSave}
                      onHide={onHide}
                      onToggleFollow={onToggleFollow}
                      onShowNotice={onShowNotice}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "saved" && (
            <div>
              {savedPosts.length === 0 ? (
                <div className="empty-tab-state">
                  <div className="empty-tab-icon-wrap">
                    <Bookmark size={28} />
                  </div>
                  <h4 className="empty-tab-title">Chưa có bài viết đã lưu</h4>
                  <p className="empty-tab-sub">
                    Lưu các bài viết quan trọng từ bảng tin để xem lại sau bất cứ
                    lúc nào.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onReact={onReact}
                      onOpenComments={onOpenComments}
                      onTogglePin={onTogglePin}
                      onToggleSave={onToggleSave}
                      onHide={onHide}
                      onToggleFollow={onToggleFollow}
                      onShowNotice={onShowNotice}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "hidden" && (
            <div>
              {hiddenPosts.length === 0 ? (
                <div className="empty-tab-state">
                  <div className="empty-tab-icon-wrap">
                    <EyeOff size={28} />
                  </div>
                  <h4 className="empty-tab-title">Không có bài viết nào bị ẩn</h4>
                  <p className="empty-tab-sub">
                    Các bài viết bạn đã ẩn khỏi bảng tin và trang cá nhân sẽ hiển
                    thị ở đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hiddenPosts.map((post) => {
                    const authorName = post.author?.displayName || "Nova Labs";
                    const isBusiness = post.author?.kind === "business" || post.isMine;

                    return (
                      <div key={post.id} className="hidden-post-card">
                        <div className="hidden-post-top">
                          <div className="hidden-post-avatar">
                            {isBusiness ? (
                              <Building2 size={16} className="text-amber-400" />
                            ) : (
                              <User size={16} className="text-sky-400" />
                            )}
                          </div>
                          <div className="hidden-post-info">
                            <span className="hidden-post-author">
                              {authorName}
                            </span>
                            <span className="hidden-post-time">
                              {post.timeLabel}
                            </span>
                          </div>
                          <div className="hidden-badge">
                            <EyeOff size={12} />
                            <span>Đã ẩn</span>
                          </div>
                        </div>

                        {post.content && (
                          <p className="hidden-post-text">{post.content}</p>
                        )}

                        {post.images.length > 0 && (
                          <div className="hidden-post-images-indicator">
                            <ImageIcon size={14} />
                            <span>{post.images.length} hình ảnh đính kèm</span>
                          </div>
                        )}

                        <div className="hidden-post-action-row">
                          <button
                            type="button"
                            className="restore-post-btn"
                            onClick={() => {
                              onRestore(post.id);
                              onShowNotice(
                                "Đã khôi phục bài viết về bảng tin."
                              );
                            }}
                          >
                            <RotateCcw size={14} />
                            <span>Khôi phục bài viết</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
