"use client";

import { useMemo, useRef, useState } from "react";
import { useCommunityFeed } from "./useCommunityFeed";
import { CommunityPost } from "@/types/community";
import { PostCard } from "./community/PostCard";
import { CommentModal } from "./community/CommentModal";
import { MyPostsModal } from "./community/MyPostsModal";
import { ProfileExplorerModal } from "./community/ProfileExplorerModal";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Globe2,
  ImageIcon,
  Layers,
  Sparkles,
  Tag,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";

const PRESET_TOPICS = [
  "Fintech",
  "Web3",
  "Solana",
  "UIUX",
  "DesignSystem",
  "Freelance",
  "Remote",
  "ProductManagement",
];

export function CommunityView() {
  const {
    posts,
    followedHandles,
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
  } = useCommunityFeed();

  // Local composer state
  const [composerText, setComposerText] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [commentingPost, setCommentingPost] = useState<CommunityPost | null>(
    null
  );
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [showProfileExplorer, setShowProfileExplorer] = useState(false);

  // Floating notice / toast state (1:1 with mobile _showNotice)
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => {
      setNotice((current) => (current === msg ? null : current));
    }, 2800);
  };

  // Filtered & sorted feed: unhidden posts, pinned first, then by date
  const feedPosts = useMemo(() => {
    return posts
      .filter((p) => !p.isHidden)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [posts]);

  // Handle image upload from file input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 10 - selectedImages.length;
    if (remainingSlots <= 0) {
      showNotice("Tối đa 10 ảnh cho mỗi bài đăng.");
      return;
    }

    const filesToLoad = Array.from(files).slice(0, remainingSlots);
    filesToLoad.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (typeof loadEvt.target?.result === "string") {
          setSelectedImages((prev) => [...prev, loadEvt.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handlePublish = () => {
    const trimmed = composerText.trim();
    if (!trimmed && selectedImages.length === 0) return;

    setIsPublishing(true);
    setTimeout(() => {
      publishPost(trimmed, selectedImages, selectedTopics);
      setComposerText("");
      setSelectedImages([]);
      setSelectedTopics([]);
      setShowTopicPicker(false);
      setIsPublishing(false);
      showNotice("Đã chia sẻ bài viết lên bảng tin cộng đồng!");
    }, 250);
  };

  // Keep commentingPost up to date if current post gets mutated in state
  const activeCommentPost = commentingPost
    ? posts.find((p) => p.id === commentingPost.id) || commentingPost
    : null;

  return (
    <div className="community-view-wrapper">
      {/* Toast Notice Banner */}
      {notice && (
        <div className="community-floating-toast" role="status" aria-live="polite">
          <span>{notice}</span>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setNotice(null)}
            aria-label="Đóng thông báo"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header matching Flutter: Title 'Cộng đồng', Subtitle, icons 🕐 and 👥 */}
      <header className="community-header">
        <div className="community-header-left">
          <Link
            href="/business/dashboard"
            className="community-back-btn"
            aria-label="Quay lại Tổng quan"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="community-title">Cộng đồng</h1>
            <p className="community-subtitle">
              Chia sẻ tiến độ, sản phẩm và cơ hội hợp tác
            </p>
          </div>
        </div>

        <div className="community-header-actions">
          {/* Icon 🕐: Bài đăng của tôi (_openMyPosts) */}
          <button
            type="button"
            className="community-icon-action-btn"
            onClick={() => setShowMyPosts(true)}
            title="Bài đăng của tôi"
            aria-label="Bài đăng của tôi"
          >
            <Clock size={19} />
          </button>

          {/* Icon 👥: Khám phá hồ sơ (_openExampleProfiles) */}
          <button
            type="button"
            className="community-icon-action-btn"
            onClick={() => setShowProfileExplorer(true)}
            title="Khám phá hồ sơ"
            aria-label="Khám phá hồ sơ"
          >
            <Users size={19} />
          </button>
        </div>
      </header>

      {/* Composer Card */}
      <div className="community-composer-card">
        <div className="composer-input-row">
          <div className="composer-avatar">
            <Building2 size={20} className="text-amber-400" />
          </div>
          <textarea
            className="composer-textarea"
            placeholder="Bắt đầu một bài đăng"
            rows={2}
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
          />
        </div>

        {/* Selected Topics Chips in Composer */}
        {selectedTopics.length > 0 && (
          <div className="composer-topics-row">
            {selectedTopics.map((t) => (
              <span key={t} className="composer-topic-chip">
                #{t}
                <button
                  type="button"
                  onClick={() => toggleTopic(t)}
                  aria-label={`Xóa chủ đề ${t}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Image Preview Strip */}
        {selectedImages.length > 0 && (
          <div className="composer-images-strip">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="composer-img-thumb-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`Preview ${idx + 1}`}
                  className="composer-img-thumb"
                />
                <button
                  type="button"
                  className="remove-thumb-btn"
                  onClick={() => handleRemoveImage(idx)}
                  aria-label="Xóa ảnh"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Topic Selector Expandable Row */}
        {showTopicPicker && (
          <div className="composer-topic-picker-bar">
            <span className="topic-picker-label">Chọn chủ đề:</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    className={`topic-select-pill ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => toggleTopic(topic)}
                  >
                    #{topic}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Composer Footer Actions */}
        <div className="composer-footer-toolbar">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              className="composer-action-pill"
              onClick={() => fileInputRef.current?.click()}
              title="Thêm ảnh"
            >
              <ImageIcon size={17} className="text-emerald-500" />
              <span>
                {selectedImages.length === 0
                  ? "Ảnh"
                  : `Ảnh (${selectedImages.length}/10)`}
              </span>
            </button>

            <button
              type="button"
              className={`composer-action-pill ${
                showTopicPicker ? "active" : ""
              }`}
              onClick={() => setShowTopicPicker(!showTopicPicker)}
              title="Gắn chủ đề"
            >
              <Tag size={16} className="text-primary" />
              <span># Chủ đề</span>
            </button>
          </div>

          <button
            type="button"
            className="composer-publish-btn"
            disabled={
              (!composerText.trim() && selectedImages.length === 0) ||
              isPublishing
            }
            onClick={handlePublish}
          >
            {isPublishing ? "Đang đăng..." : "Đăng"}
          </button>
        </div>
      </div>

      {/* Feed Section Heading: 'Dành cho bạn' */}
      <div className="feed-section-heading">
        <div className="flex items-center gap-2">
          <Layers size={17} className="text-primary" />
          <span className="section-title-text">Dành cho bạn</span>
        </div>
      </div>

      {/* Feed Posts List */}
      <div className="community-posts-feed">
        {!isLoaded ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Đang tải bảng tin cộng đồng...
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="feed-empty-box">
            <Globe2 size={36} className="text-muted-foreground mb-2" />
            <p className="font-semibold text-foreground">
              Bảng tin chưa có bài viết nào
            </p>
            <p className="text-sm text-muted-foreground">
              Hãy bắt đầu bằng cách chia sẻ dự án hoặc tiến độ của Nova Labs!
            </p>
          </div>
        ) : (
          feedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onReact={reactToPost}
              onOpenComments={(p) => setCommentingPost(p)}
              onTogglePin={togglePin}
              onToggleSave={toggleSave}
              onHide={hidePost}
              onToggleFollow={toggleFollowAuthor}
              isFollowing={
                post.author
                  ? followedHandles.includes(post.author.handle)
                  : false
              }
              onShowNotice={showNotice}
            />
          ))
        )}
      </div>

      {/* Comment Modal */}
      {activeCommentPost && (
        <CommentModal
          post={activeCommentPost}
          isOpen={activeCommentPost !== null}
          onClose={() => setCommentingPost(null)}
          onAddComment={addComment}
          onAddReply={addReply}
          onToggleLike={toggleCommentLike}
        />
      )}

      {/* My Posts Modal (3 Tabs) */}
      <MyPostsModal
        posts={posts}
        isOpen={showMyPosts}
        onClose={() => setShowMyPosts(false)}
        onReact={reactToPost}
        onOpenComments={(p) => setCommentingPost(p)}
        onTogglePin={togglePin}
        onToggleSave={toggleSave}
        onHide={hidePost}
        onRestore={restorePost}
        onToggleFollow={toggleFollowAuthor}
        onShowNotice={showNotice}
      />

      {/* Profile Explorer Modal */}
      <ProfileExplorerModal
        isOpen={showProfileExplorer}
        onClose={() => setShowProfileExplorer(false)}
        onToggleFollow={toggleFollowAuthor}
        followedHandles={followedHandles}
      />
    </div>
  );
}
