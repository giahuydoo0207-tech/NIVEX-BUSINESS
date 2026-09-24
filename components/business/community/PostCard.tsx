"use client";

import { useEffect, useRef, useState } from "react";
import { CommunityPost, PostPrivacy, PostReactionType } from "@/types/community";
import { POST_REACTIONS } from "@/lib/community-constants";
import {
  calculateTotalComments,
  determineGalleryLayout,
  getTopReactions,
} from "@/lib/community-utils";
import Link from "next/link";
import {
  ArrowUpRight,
  Ban,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Copy,
  Edit3,
  EyeOff,
  Flag,
  Globe2,
  Lock,
  MessageCircle,
  MessagesSquare,
  MoreHorizontal,
  Pin,
  PinOff,
  Repeat2,
  Send,
  ShieldAlert,
  ThumbsUp,
  Trash2,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { ReactionPicker } from "./ReactionPicker";
import { FullscreenImageViewer } from "./FullscreenImageViewer";
import {
  ConfirmBlockModal,
  ConfirmDeleteModal,
  EditPostModal,
  PrivacyModal,
  ReportPostModal,
} from "./PostActionModals";

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
  onDeletePost?: (postId: string) => void;
  onBlockUser?: (handle: string) => void;
  onEditPost?: (postId: string, content: string, topics?: string[]) => void;
  onUpdatePrivacy?: (postId: string, privacy: PostPrivacy) => void;
  initialShowOptions?: boolean;
  initialShowDelete?: boolean;
  initialShowBlock?: boolean;
  initialShowReport?: boolean;
  initialShowPrivacy?: boolean;
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
  onDeletePost,
  onBlockUser,
  onEditPost,
  onUpdatePrivacy,
  initialShowOptions = false,
  initialShowDelete = false,
  initialShowBlock = false,
  initialShowReport = false,
  initialShowPrivacy = false,
}: PostCardProps) {
  const [showOptions, setShowOptions] = useState(initialShowOptions);
  const [showPicker, setShowPicker] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(initialShowDelete);
  const [showBlockConfirm, setShowBlockConfirm] = useState(initialShowBlock);
  const [showReportModal, setShowReportModal] = useState(initialShowReport);
  const [showPrivacyModal, setShowPrivacyModal] = useState(initialShowPrivacy);
  const [showEditModal, setShowEditModal] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggered = useRef<boolean>(false);

  useEffect(() => {
    if (initialShowOptions) setShowOptions(true);
    if (initialShowDelete) setShowDeleteConfirm(true);
    if (initialShowBlock) setShowBlockConfirm(true);
    if (initialShowReport) setShowReportModal(true);
    if (initialShowPrivacy) setShowPrivacyModal(true);
  }, [
    initialShowOptions,
    initialShowDelete,
    initialShowBlock,
    initialShowReport,
    initialShowPrivacy,
  ]);

  // Close picker on scroll or unmount
  useEffect(() => {
    const handleScroll = () => {
      if (showPicker) {
        setShowPicker(false);
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      if (longPressRef.current) {
        clearTimeout(longPressRef.current);
        longPressRef.current = null;
      }
    };
  }, [showPicker]);

  // Preview automation helper for visual QA

  const handleMouseEnter = (e: React.MouseEvent) => {
    // Only for desktop mouse
    if ((e.nativeEvent as PointerEvent).pointerType === "touch") return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShowPicker(true);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setShowPicker(false);
      closeTimeoutRef.current = null;
    }, 200);
  };

  const handleSelectReaction = (r: PostReactionType) => {
    onReact(post.id, r);
    setShowPicker(false);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleClickLike = () => {
    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      return;
    }
    if (post.myReaction) {
      onReact(post.id, post.myReaction);
    } else {
      onReact(post.id, "like");
    }
  };

  const handleTouchStart = () => {
    longPressRef.current = setTimeout(() => {
      setShowPicker(true);
      isLongPressTriggered.current = true;
    }, 300);
  };

  const handleTouchMove = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

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

  // Dynamic reaction badges from real counts (max 2)
  const dynamicBadges = getTopReactions(post);
  const badges: PostReactionType[] =
    dynamicBadges.length > 0
      ? dynamicBadges
      : post.reactionCount > 0
        ? [post.myReaction || "like"]
        : [];

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
          <div className="post-options-wrap">
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
                  {post.isMine ? (
                    <>
                      {onTogglePin && (
                        <button
                          type="button"
                          className="post-menu-item"
                          onClick={() => {
                            onTogglePin(post.id);
                            setShowOptions(false);
                            onShowNotice(
                              post.isPinned
                                ? "Đã bỏ ghim bài viết."
                                : "Đã ghim bài viết lên đầu trang cá nhân."
                            );
                          }}
                        >
                          <span className="post-menu-icon">
                            {post.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                          </span>
                          <div className="post-menu-text-wrap">
                            <span className="post-menu-title">
                              {post.isPinned ? "Bỏ ghim bài viết" : "Ghim bài viết"}
                            </span>
                            <span className="post-menu-subtitle">
                              {post.isPinned
                                ? "Gỡ ghim khỏi đầu trang cá nhân"
                                : "Ghim lên đầu trang cá nhân"}
                            </span>
                          </div>
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
                          <span className="post-menu-icon">
                            <Bookmark size={16} />
                          </span>
                          <div className="post-menu-text-wrap">
                            <span className="post-menu-title">
                              {post.isSaved ? "Bỏ lưu bài viết" : "Lưu bài viết"}
                            </span>
                            <span className="post-menu-subtitle">
                              {post.isSaved
                                ? "Xóa khỏi danh sách các mục đã lưu."
                                : "Thêm vào danh sách các mục đã lưu."}
                            </span>
                          </div>
                        </button>
                      )}

                      <button
                        type="button"
                        className="post-menu-item"
                        onClick={() => {
                          setShowEditModal(true);
                          setShowOptions(false);
                        }}
                      >
                        <span className="post-menu-icon">
                          <Edit3 size={16} />
                        </span>
                        <div className="post-menu-text-wrap">
                          <span className="post-menu-title">Chỉnh sửa bài viết</span>
                          <span className="post-menu-subtitle">
                            Cập nhật nội dung hoặc chủ đề
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="post-menu-item"
                        onClick={() => {
                          setShowPrivacyModal(true);
                          setShowOptions(false);
                        }}
                      >
                        <span className="post-menu-icon">
                          <Lock size={16} />
                        </span>
                        <div className="post-menu-text-wrap">
                          <span className="post-menu-title">Chỉnh sửa quyền riêng tư</span>
                          <span className="post-menu-subtitle">
                            {post.privacy === "only_me"
                              ? "Chế độ: Chỉ mình tôi"
                              : post.privacy === "followers"
                              ? "Chế độ: Người theo dõi"
                              : "Chế độ: Công khai"}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="post-menu-item"
                        onClick={() => {
                          handleCopyLink();
                          setShowOptions(false);
                        }}
                      >
                        <span className="post-menu-icon">
                          <Copy size={16} />
                        </span>
                        <div className="post-menu-text-wrap">
                          <span className="post-menu-title">Sao chép liên kết</span>
                          <span className="post-menu-subtitle">
                            Sao chép liên kết bài viết vào clipboard
                          </span>
                        </div>
                      </button>

                      {onHide && (
                        <button
                          type="button"
                          className="post-menu-item"
                          onClick={() => {
                            onHide(post.id);
                            setShowOptions(false);
                            onShowNotice("Đã ẩn bài viết khỏi bảng tin.");
                          }}
                        >
                          <span className="post-menu-icon">
                            <EyeOff size={16} />
                          </span>
                          <div className="post-menu-text-wrap">
                            <span className="post-menu-title">Ẩn khỏi bảng tin</span>
                            <span className="post-menu-subtitle">
                              Tạm thời ẩn bài viết này khỏi bảng tin
                            </span>
                          </div>
                        </button>
                      )}

                      {onDeletePost && (
                        <>
                          <div className="post-menu-divider" />
                          <button
                            type="button"
                            className="post-menu-item danger"
                            onClick={() => {
                              setShowDeleteConfirm(true);
                              setShowOptions(false);
                            }}
                          >
                            <span className="post-menu-icon text-red-500">
                              <Trash2 size={16} />
                            </span>
                            <div className="post-menu-text-wrap">
                              <span className="post-menu-title text-red-500 font-semibold">
                                Xóa bài viết
                              </span>
                              <span className="post-menu-subtitle text-red-400/80">
                                Xóa vĩnh viễn bài đăng này
                              </span>
                            </div>
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
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
                          <span className="post-menu-icon">
                            <Bookmark size={16} />
                          </span>
                          <div className="post-menu-text-wrap">
                            <span className="post-menu-title">
                              {post.isSaved ? "Bỏ lưu bài viết" : "Lưu bài viết"}
                            </span>
                            <span className="post-menu-subtitle">
                              {post.isSaved
                                ? "Xóa khỏi danh sách các mục đã lưu."
                                : "Thêm vào danh sách các mục đã lưu."}
                            </span>
                          </div>
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
                        <span className="post-menu-icon">
                          <Copy size={16} />
                        </span>
                        <div className="post-menu-text-wrap">
                          <span className="post-menu-title">Sao chép liên kết</span>
                          <span className="post-menu-subtitle">
                            Sao chép liên kết bài viết vào clipboard
                          </span>
                        </div>
                      </button>

                      {onHide && (
                        <button
                          type="button"
                          className="post-menu-item"
                          onClick={() => {
                            onHide(post.id);
                            setShowOptions(false);
                            onShowNotice("Đã ẩn bài viết khỏi bảng tin.");
                          }}
                        >
                          <span className="post-menu-icon">
                            <EyeOff size={16} />
                          </span>
                          <div className="post-menu-text-wrap">
                            <span className="post-menu-title">Ẩn bài viết này</span>
                            <span className="post-menu-subtitle">
                              Không hiển thị bài viết này trên bảng tin.
                            </span>
                          </div>
                        </button>
                      )}

                      {post.author && onToggleFollow && (
                        <button
                          type="button"
                          className="post-menu-item"
                          onClick={() => {
                            onToggleFollow(post.author!.handle);
                            setShowOptions(false);
                            onShowNotice(
                              isFollowing
                                ? `Đã bỏ theo dõi ${post.author!.displayName}.`
                                : `Đang theo dõi ${post.author!.displayName}.`
                            );
                          }}
                        >
                          <span className="post-menu-icon">
                            {isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />}
                          </span>
                          <div className="post-menu-text-wrap">
                            <span className="post-menu-title">
                              {isFollowing ? "Bỏ theo dõi tác giả" : "Theo dõi tác giả"}
                            </span>
                            <span className="post-menu-subtitle">
                              {isFollowing
                                ? "Ngừng nhận cập nhật từ người này."
                                : "Nhận thông báo khi có bài viết mới."}
                            </span>
                          </div>
                        </button>
                      )}

                      <button
                        type="button"
                        className="post-menu-item"
                        onClick={() => {
                          setShowReportModal(true);
                          setShowOptions(false);
                        }}
                      >
                        <span className="post-menu-icon">
                          <Flag size={16} />
                        </span>
                        <div className="post-menu-text-wrap">
                          <span className="post-menu-title">Báo cáo bài viết</span>
                          <span className="post-menu-subtitle">
                            Báo cáo vi phạm tiêu chuẩn cộng đồng.
                          </span>
                        </div>
                      </button>

                      {post.author && onBlockUser && (
                        <>
                          <div className="post-menu-divider" />
                          <button
                            type="button"
                            className="post-menu-item danger"
                            onClick={() => {
                              setShowBlockConfirm(true);
                              setShowOptions(false);
                            }}
                          >
                            <span className="post-menu-icon text-red-500">
                              <Ban size={16} />
                            </span>
                            <div className="post-menu-text-wrap">
                              <span className="post-menu-title text-red-500 font-semibold">
                                Chặn @{post.author.handle}
                              </span>
                              <span className="post-menu-subtitle text-red-400/80">
                                Không còn nhìn thấy bài viết từ người này
                              </span>
                            </div>
                          </button>
                        </>
                      )}
                    </>
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

      {/* Flow Integration: Linked Context Cards */}
      {Boolean(
        post.topics?.some((t) =>
          ["TuyểnDụng", "CơHội", "tuyendung", "cohoi", "vieclam", "Job"].includes(t)
        ) ||
        (post.author?.kind === "business" && post.author?.openings && post.author.openings.length > 0)
      ) && (
        <div className="post-context-card job-context-card">
          <div className="post-context-header">
            <BriefcaseBusiness size={15} />
            <span>Cơ hội việc làm liên kết</span>
          </div>
          <div className="post-context-body">
            <h4>Flutter Developer · Remote</h4>
            <p>Nova Labs đang mở tuyển ứng viên phù hợp với ngân sách 1,500 - 2,500 USDC.</p>
          </div>
          <div className="post-context-actions">
            <Link href="/business/jobs" className="post-context-btn primary">
              <span>Xem danh sách cơ hội</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {post.author?.kind === "freelancer" && (
        <div className="post-context-card freelancer-context-card">
          <div className="post-context-header">
            <UserCheck size={15} />
            <span>Chuyên gia mở nhận dự án</span>
          </div>
          <div className="post-context-body">
            <h4>{post.author.displayName} · {post.author.headline}</h4>
            <p>{post.author.bio}</p>
          </div>
          <div className="post-context-actions">
            <Link
              href={`/business/messages?candidate=${post.author.handle}`}
              className="post-context-btn primary"
            >
              <MessagesSquare size={13} />
              <span>Nhắn tin trao đổi</span>
            </Link>
            <Link href="/business/applications" className="post-context-btn secondary">
              <span>Xem danh sách ứng viên</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
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
      <div className="post-action-bar">
        <div
          className="reaction-action-wrapper"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {showPicker && (
            <ReactionPicker
              onSelect={handleSelectReaction}
              onClose={() => setShowPicker(false)}
            />
          )}

          <button
            type="button"
            className={`post-action-btn ${myReactionConfig ? "reacted" : ""}`}
            style={{ color: reactionColor }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleClickLike}
            title="Bày tỏ cảm xúc"
          >
            <ReactionIcon size={18} />
            <span>{reactionLabel}</span>
          </button>
        </div>

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

      {/* Action Dialogs */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDeletePost?.(post.id);
          onShowNotice("Đã xóa bài viết.");
        }}
      />

      {post.author && (
        <ConfirmBlockModal
          isOpen={showBlockConfirm}
          onClose={() => setShowBlockConfirm(false)}
          authorHandle={post.author.handle}
          authorName={post.author.displayName}
          onConfirm={() => {
            onBlockUser?.(post.author!.handle);
            onShowNotice("Đã chặn người dùng.");
          }}
        />
      )}

      <ReportPostModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={(_reason) => {
          onShowNotice("Cảm ơn bạn. Báo cáo đã được gửi đến ban quản trị.");
        }}
      />

      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        currentPrivacy={post.privacy || "public"}
        onSave={(p) => {
          onUpdatePrivacy?.(post.id, p);
          onShowNotice("Đã cập nhật quyền riêng tư bài viết.");
        }}
      />

      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialContent={post.content}
        initialTopics={post.topics || []}
        onSave={(content, topics) => {
          onEditPost?.(post.id, content, topics);
          onShowNotice("Đã cập nhật bài viết thành công.");
        }}
      />
    </article>
  );
}
