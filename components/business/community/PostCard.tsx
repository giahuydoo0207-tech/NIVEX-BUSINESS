"use client";

import { useRef, useState } from "react";
import { CommunityPost, PostReactionType } from "@/types/community";
import { POST_REACTIONS } from "@/lib/community-constants";
import {
  calculateTotalComments,
  determineGalleryLayout,
} from "@/lib/community-utils";
import {
  Bookmark,
  Building2,
  CheckCircle2,
  Copy,
  EyeOff,
  Globe2,
  MessageCircle,
  MoreHorizontal,
  Pin,
  PinOff,
  Repeat2,
  Send,
  ThumbsUp,
  User,
} from "lucide-react";
import { ReactionPicker } from "./ReactionPicker";
import { FullscreenImageViewer } from "./FullscreenImageViewer";

interface PostCardProps {
  post: CommunityPost;
  onReact: (postId: string, reaction: PostReactionType) => void;
  onOpenComments: (post: CommunityPost) => void;
  onTogglePin?: (postId: string) => void;
  onToggleSave?: (postId: string) => void;
  onHide?: (postId: string) => void;
  onToggleFollow?: (handle: string) => void;
  isFollowing?: boolean;
  onShowNotice: (msg: string) => void;
}

export function PostCard({
  post,
  onReact,
  onOpenComments,
  onTogglePin,
  onToggleSave,
  onHide,
  onToggleFollow,
  isFollowing = false,
  onShowNotice,
}: PostCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggered = useRef<boolean>(false);

  const authorName =
    post.author?.displayName || (post.isMine ? "Nova Labs" : "Người dùng");
  const authorHeadline =
    post.author?.headline ||
    (post.isMine ? "Fintech · Web3 · Remote-first" : "");
  const isBusiness =
    post.author?.kind === "business" || (post.isMine && !post.author);
  const totalComments = calculateTotalComments(post.comments);
  const galleryLayout = determineGalleryLayout(post.images.length);

  // Reaction button state
  const myReactionConfig = post.myReaction ? POST_REACTIONS[post.myReaction] : null;
  const ReactionIcon = myReactionConfig ? myReactionConfig.icon : ThumbsUp;
  const reactionLabel = myReactionConfig ? myReactionConfig.label : "Thích";
  const reactionColor = myReactionConfig ? myReactionConfig.color : undefined;

  // Overlapping badges stack
  const badges: PostReactionType[] = [];
  if (post.myReaction) {
    badges.push(post.myReaction);
  } else {
    badges.push("like");
  }
  if (badges[0] !== "trust" && post.reactionCount > 1) {
    badges.push("trust");
  } else if (badges[0] !== "launch" && post.reactionCount > 1) {
    badges.push("launch");
  }

  const handleCopyLink = () => {
    try {
      const url = `${window.location.origin}/business/community#${post.id}`;
      navigator.clipboard.writeText(url);
      onShowNotice("Đã sao chép liên kết bài viết vào clipboard.");
    } catch {
      onShowNotice("Đã sao chép ID bài viết: " + post.id);
    }
  };

  return (
    <article className="community-post-card" id={post.id}>
      {/* Top Author Row */}
      <div className="post-header-row">
        <div className="flex items-center gap-3">
          <div
            className={`post-avatar-wrap ${
              isBusiness ? "business" : "freelancer"
            }`}
          >
            {isBusiness ? (
              <Building2 size={20} />
            ) : (
              <User size={20} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="post-author-name">{authorName}</span>
              {(post.author?.isVerified || post.isMine) && (
                <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
              )}
              {post.isPinned && (
                <span className="post-pinned-badge">
                  <Pin size={11} />
                  <span>Đã ghim</span>
                </span>
              )}
            </div>
            {authorHeadline && (
              <p className="post-author-headline">{authorHeadline}</p>
            )}
            <div className="post-time-row">
              <span>{post.timeLabel}</span>
              <Globe2 size={11} className="text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 relative">
          {!post.isMine && post.author && onToggleFollow && (
            <button
              type="button"
              className={`post-follow-btn ${isFollowing ? "following" : ""}`}
              onClick={() => onToggleFollow(post.author!.handle)}
            >
              {isFollowing ? "Đang theo dõi" : "+ Theo dõi"}
            </button>
          )}

          {/* 3-dots Menu */}
          <div className="relative">
            <button
              type="button"
              className="post-options-trigger"
              onClick={() => setShowOptions(!showOptions)}
              aria-label="Tùy chọn bài viết"
            >
              <MoreHorizontal size={18} />
            </button>

            {showOptions && (
              <>
                <div
                  className="post-menu-backdrop"
                  onClick={() => setShowOptions(false)}
                />
                <div className="post-options-menu">
                  {post.isMine && onTogglePin && (
                    <button
                      type="button"
                      className="post-menu-item"
                      onClick={() => {
                        onTogglePin(post.id);
                        setShowOptions(false);
                      }}
                    >
                      {post.isPinned ? <PinOff size={15} /> : <Pin size={15} />}
                      <span>{post.isPinned ? "Bỏ ghim" : "Ghim bài viết"}</span>
                    </button>
                  )}

                  {onToggleSave && (
                    <button
                      type="button"
                      className="post-menu-item"
                      onClick={() => {
                        onToggleSave(post.id);
                        setShowOptions(false);
                        onShowNotice(
                          post.isSaved
                            ? "Đã bỏ lưu bài viết."
                            : "Đã lưu bài viết vào danh sách."
                        );
                      }}
                    >
                      <Bookmark size={15} />
                      <span>{post.isSaved ? "Bỏ lưu" : "Lưu bài viết"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="post-menu-item"
                    onClick={() => {
                      handleCopyLink();
                      setShowOptions(false);
                    }}
                  >
                    <Copy size={15} />
                    <span>Sao chép liên kết</span>
                  </button>

                  {onHide && (
                    <button
                      type="button"
                      className="post-menu-item text-danger"
                      onClick={() => {
                        onHide(post.id);
                        setShowOptions(false);
                        onShowNotice("Đã ẩn bài viết khỏi bảng tin.");
                      }}
                    >
                      <EyeOff size={15} />
                      <span>Ẩn bài viết</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      {post.content && (
        <div className="post-content-text">
          <p>{post.content}</p>
        </div>
      )}

      {/* Topics */}
      {post.topics && post.topics.length > 0 && (
        <div className="post-topics-row">
          {post.topics.map((t) => (
            <span key={t} className="post-topic-chip">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Post Gallery */}
      {galleryLayout !== "none" && (
        <div className={`post-gallery-container layout-${galleryLayout}`}>
          {galleryLayout === "single" && (
            <div
              className="gallery-img-wrapper single"
              onClick={() => setViewerIndex(0)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.images[0]}
                alt="Hình ảnh bài đăng"
                className="gallery-img"
              />
            </div>
          )}

          {galleryLayout === "double" && (
            <div className="gallery-double-grid">
              {post.images.slice(0, 2).map((img, idx) => (
                <div
                  key={idx}
                  className="gallery-img-wrapper"
                  onClick={() => setViewerIndex(idx)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`Ảnh ${idx + 1}`}
                    className="gallery-img"
                  />
                </div>
              ))}
            </div>
          )}

          {galleryLayout === "triple" && (
            <div className="gallery-triple-grid">
              <div
                className="gallery-img-wrapper triple-main"
                onClick={() => setViewerIndex(0)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.images[0]}
                  alt="Ảnh 1"
                  className="gallery-img"
                />
              </div>
              <div className="gallery-triple-side">
                <div
                  className="gallery-img-wrapper"
                  onClick={() => setViewerIndex(1)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.images[1]}
                    alt="Ảnh 2"
                    className="gallery-img"
                  />
                </div>
                <div
                  className="gallery-img-wrapper"
                  onClick={() => setViewerIndex(2)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.images[2]}
                    alt="Ảnh 3"
                    className="gallery-img"
                  />
                </div>
              </div>
            </div>
          )}

          {galleryLayout === "quad" && (
            <div className="gallery-quad-grid">
              {post.images.slice(0, 4).map((img, idx) => {
                const isFourth = idx === 3;
                const extraCount = post.images.length - 4;

                return (
                  <div
                    key={idx}
                    className="gallery-img-wrapper quad-cell relative"
                    onClick={() => setViewerIndex(idx)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Ảnh ${idx + 1}`}
                      className="gallery-img"
                    />
                    {isFourth && extraCount > 0 && (
                      <div className="gallery-overlay-badge">
                        +{extraCount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reaction Summary & Comments count */}
      <div className="post-summary-row">
        {post.reactionCount > 0 ? (
          <div className="reaction-summary-stack">
            <div className="mini-badges-cluster">
              {badges.map((bKey, idx) => {
                const bConfig = POST_REACTIONS[bKey];
                const BIcon = bConfig.icon;
                return (
                  <div
                    key={idx}
                    className="mini-badge-circle"
                    style={{
                      backgroundColor: bConfig.color,
                      left: `${idx * 13}px`,
                      zIndex: 3 - idx,
                    }}
                  >
                    <BIcon size={10} color="#ffffff" strokeWidth={2.5} />
                  </div>
                );
              })}
            </div>
            <span
              className="reaction-count-text"
              style={{
                marginLeft: badges.length > 1 ? `${(badges.length - 1) * 13 + 4}px` : "4px",
              }}
            >
              {post.reactionCount}
            </span>
          </div>
        ) : (
          <div />
        )}

        {totalComments > 0 && (
          <button
            type="button"
            className="comments-count-btn"
            onClick={() => onOpenComments(post)}
          >
            {totalComments} bình luận
          </button>
        )}
      </div>

      {/* Action Bar (4 buttons) */}
      <div className="post-action-bar relative">
        {/* Reaction Pill Hover/Active */}
        {showPicker && (
          <ReactionPicker
            onSelect={(r) => {
              onReact(post.id, r);
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        )}

        <button
          type="button"
          className={`post-action-btn ${myReactionConfig ? "reacted" : ""}`}
          style={{ color: reactionColor }}
          onTouchStart={() => {
            longPressRef.current = setTimeout(() => {
              setShowPicker(true);
              isLongPressTriggered.current = true;
            }, 300);
          }}
          onTouchMove={() => {
            if (longPressRef.current) {
              clearTimeout(longPressRef.current);
              longPressRef.current = null;
            }
          }}
          onTouchEnd={() => {
            if (longPressRef.current) {
              clearTimeout(longPressRef.current);
              longPressRef.current = null;
            }
          }}
          onClick={() => {
            if (isLongPressTriggered.current) {
              isLongPressTriggered.current = false;
              return;
            }
            if (post.myReaction) {
              onReact(post.id, post.myReaction);
            } else {
              onReact(post.id, "like");
            }
          }}
          onMouseEnter={() => setShowPicker(true)}
          title="Bày tỏ cảm xúc"
        >
          <ReactionIcon size={18} />
          <span>{reactionLabel}</span>
        </button>

        <button
          type="button"
          className="post-action-btn"
          onClick={() => onOpenComments(post)}
        >
          <MessageCircle size={18} />
          <span>Bình luận</span>
        </button>

        {/* Nút Đăng lại: Phương án A (Chuẩn theo Mobile posts_screen.dart: dòng 2028-2031) */}
        <button
          type="button"
          className="post-action-btn"
          onClick={() =>
            onShowNotice("Tính năng Đăng lại sẽ được kết nối sau.")
          }
        >
          <Repeat2 size={18} />
          <span>Đăng lại</span>
        </button>

        {/* Nút Gửi: Chuẩn theo Mobile posts_screen.dart: dòng 2038-2041 + copy link tiện ích */}
        <button
          type="button"
          className="post-action-btn"
          onClick={() => {
            handleCopyLink();
            onShowNotice("Tính năng Gửi tin nhắn sẽ được kết nối sau.");
          }}
        >
          <Send size={18} />
          <span>Gửi</span>
        </button>
      </div>

      {/* Fullscreen Image Viewer Modal */}
      {viewerIndex !== null && (
        <FullscreenImageViewer
          images={post.images}
          initialIndex={viewerIndex}
          isOpen={viewerIndex !== null}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </article>
  );
}
