"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  FileCheck2,
  FileText,
  Globe2,
  ImageUp,
  MailCheck,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useCommunityFeed } from "./useCommunityFeed";
import { useJobs } from "./useJobs";
import { useApplications } from "./useApplications";
import { PostCard } from "./community/PostCard";
import { CommentModal } from "./community/CommentModal";
import { jobStatusLabels, jobStatusTone } from "@/lib/jobs";
import { formatMinorAmount } from "@/lib/money";
import { formatDate } from "@/lib/portal-data";
import { demoApplications } from "@/lib/application-demo-data";
import type { JobPost } from "@/types/job";
import type { CommunityPost } from "@/types/community";

export interface BusinessProfile {
  handle: string;
  name: string;
  coverImageUrl?: string;
  logoUrl?: string;
  isVerified: boolean;
  category: string;
  bio: string;
  followerCount: number;
  emailVerified: boolean;
  identityVerified: boolean;
}

export interface ActivityItem {
  id: string;
  type: "job_published" | "applicant_hired" | "post_published";
  label: string;
  timestamp: string;
  linkHref?: string;
}

const INITIAL_PROFILE: BusinessProfile = {
  handle: "nova.labs",
  name: "Nova Labs",
  isVerified: true,
  category: "Fintech · Web3 · Remote-first",
  bio: "Hạ tầng thanh toán và giải pháp việc làm số thế hệ mới cho freelancer và doanh nghiệp toàn cầu.",
  followerCount: 128,
  emailVerified: true,
  identityVerified: true,
};

function budgetLabel(job: JobPost) {
  const minimum = formatMinorAmount(job.budgetMinMinor, 6, 2);
  const maximum = formatMinorAmount(job.budgetMaxMinor, 6, 2);
  return `${minimum}-${maximum} USDC${job.paymentType === "HOURLY" ? "/giờ" : ""}`;
}

function formatActivityTime(value?: string) {
  if (!value) return "Gần đây";
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return formatDate(value);
    }
  } catch {
    /* fallback */
  }
  return value;
}

function toDevnetMediaUrl(value?: string) {
  if (!value) return undefined;
  const path = value.replace(/^https?:\/\/[^/]+/i, "").replace(/^\/api\/v1\//, "/");
  return path.startsWith("/media/business-profile/") ? `/api/devnet${path}` : value;
}

export function BusinessProfileView() {
  const [profile, setProfile] = useState<BusinessProfile>(INITIAL_PROFILE);
  const [activeTab, setActiveTab] = useState<"posts" | "jobs" | "about" | "activity">("posts");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [commentingPost, setCommentingPost] = useState<CommunityPost | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState(profile.name);
  const [editCategory, setEditCategory] = useState(profile.category);
  const [editBio, setEditBio] = useState(profile.bio);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PAYMENT_MODE !== "devnet") return;
    fetch("/api/devnet/business/profile", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const value = await response.json();
      setProfile((current) => ({ ...current, name: value.name ?? current.name, category: value.category ?? current.category, bio: value.bio ?? current.bio, followerCount: value.followerCount ?? current.followerCount, logoUrl: toDevnetMediaUrl(value.avatarUrl) ?? current.logoUrl, coverImageUrl: toDevnetMediaUrl(value.coverUrl) ?? current.coverImageUrl }));
    }).catch(() => undefined);
  }, []);

  const uploadImage = async (kind: "avatar" | "cover", file?: File) => {
    if (!file) return;
    const form = new FormData(); form.append("file", file);
    const response = await fetch(`/api/devnet/business/profile/${kind}`, { method: "POST", body: form });
    if (!response.ok) { showNotice("Không thể tải ảnh. Chỉ dùng PNG, JPEG hoặc WebP."); return; }
    const value = await response.json();
    setProfile((current) => ({ ...current, logoUrl: toDevnetMediaUrl(value.avatarUrl) ?? current.logoUrl, coverImageUrl: toDevnetMediaUrl(value.coverUrl) ?? current.coverImageUrl }));
    showNotice(kind === "avatar" ? "Đã cập nhật avatar." : "Đã cập nhật ảnh nền.");
  };

  // Data sources
  const {
    posts,
    reactToPost,
    addComment,
    addReply,
    toggleCommentLike,
    togglePin,
    toggleSave,
    hidePost,
    deletePost,
  } = useCommunityFeed();

  const { jobs } = useJobs();
  const { getJobApplicationCount } = useApplications();

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => {
      setNotice((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  // Filter posts by nova.labs
  const businessPosts = useMemo(
    () => posts.filter((p) => p.author?.handle === profile.handle),
    [posts, profile.handle],
  );

  // Published jobs only
  const publishedJobs = useMemo(
    () => jobs.filter((j) => j.status === "PUBLISHED"),
    [jobs],
  );

  // Hired applications
  const hiredApplicants = useMemo(
    () => demoApplications.filter((a) => a.status === "accepted"),
    [],
  );

  // Aggregated activity timeline
  const activities = useMemo<ActivityItem[]>(() => {
    const list: ActivityItem[] = [];

    // Job published activities
    publishedJobs.forEach((j) => {
      list.push({
        id: `act-job-${j.id}`,
        type: "job_published",
        label: `Đã mở đăng tuyển vị trí "${j.title}"`,
        timestamp: j.createdAt,
        linkHref: `/business/jobs/${j.id}`,
      });
    });

    // Applicant hired activities
    hiredApplicants.forEach((a) => {
      list.push({
        id: `act-hired-${a.id}`,
        type: "applicant_hired",
        label: `Đã tuyển dụng ứng viên ${a.candidateName} cho vị trí ${a.jobTitle}`,
        timestamp: a.createdAt || a.submittedAt || "2026-09-08T08:30:00Z",
        linkHref: `/business/applications?candidate=${a.id}`,
      });
    });

    // Post published activities
    businessPosts.forEach((p) => {
      list.push({
        id: `act-post-${p.id}`,
        type: "post_published",
        label: `Đã đăng bài viết: "${p.content.slice(0, 50)}${p.content.length > 50 ? "..." : ""}"`,
        timestamp: p.createdAt,
        linkHref: `/business/community`,
      });
    });

    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [publishedJobs, hiredApplicants, businessPosts]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile((prev) => ({
      ...prev,
      name: editName.trim() || prev.name,
      category: editCategory.trim() || prev.category,
      bio: editBio.trim() || prev.bio,
    }));
    setIsEditOpen(false);
    showNotice("Đã cập nhật hồ sơ doanh nghiệp.");
  };

  return (
    <div className="business-profile-view">
      {notice && (
        <div className="community-toast" role="status">
          <span>{notice}</span>
        </div>
      )}
      <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => uploadImage("avatar", event.target.files?.[0])} />
      <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => uploadImage("cover", event.target.files?.[0])} />

      {/* Profile Header Card */}
      <section className="business-profile-header-card" aria-label="Hồ sơ doanh nghiệp">
        <div className="business-profile-cover" style={profile.coverImageUrl ? { backgroundImage: `url(${profile.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
          <div className="cover-gradient-accent" />
        </div>

        <div className="business-profile-body">
          <div className="business-profile-avatar-row">
            {/* Neutral avatar 🏢, NO reputation ring */}
            <div className="business-profile-avatar" aria-label={`Logo của ${profile.name}`}>
              {profile.logoUrl ? <img src={profile.logoUrl} alt="" onError={() => setProfile((current) => ({ ...current, logoUrl: undefined }))} /> : <Building2 size={38} strokeWidth={1.8} />}
            </div>

            <div className="business-profile-actions">
              <button
                type="button"
                className="business-secondary-button profile-edit-btn"
                onClick={() => {
                  setEditName(profile.name);
                  setEditCategory(profile.category);
                  setEditBio(profile.bio);
                  setIsEditOpen(true);
                }}
              >
                <Edit3 size={15} />
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            </div>
          </div>

          <div className="business-profile-info">
            <div className="business-profile-title-row">
              <h1 className="business-profile-name">{profile.name}</h1>
              {profile.isVerified && (
                <span className="business-verified-badge" title="Tổ chức đã xác minh">
                  <CheckCircle2 size={18} />
                </span>
              )}
            </div>

            <div className="business-profile-handle">@{profile.handle}</div>
            <div className="business-profile-category">{profile.category}</div>

            <div className="business-profile-meta">
              <span className="profile-follower-count">
                <Users size={15} />
                <strong>{profile.followerCount}</strong> người theo dõi
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Tab Navigation */}
        <nav
          className="business-profile-tabs-nav"
          role="tablist"
          aria-label="Các mục hồ sơ doanh nghiệp"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "posts"}
            className={`profile-tab-button ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            Bài đăng
            <span className="profile-tab-count">{businessPosts.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "jobs"}
            className={`profile-tab-button ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("jobs")}
          >
            Cơ hội
            <span className="profile-tab-count">{publishedJobs.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "about"}
            className={`profile-tab-button ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            Giới thiệu
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "activity"}
            className={`profile-tab-button ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            Hoạt động
            <span className="profile-tab-count">{activities.length}</span>
          </button>
        </nav>
      </section>

      {/* Tab Panels */}
      <section className="business-profile-content">
        {/* Tab 1: Bài đăng */}
        {activeTab === "posts" && (
          <div className="profile-tab-panel" role="tabpanel" aria-label="Bài đăng của doanh nghiệp">
            {businessPosts.length === 0 ? (
              <div className="profile-empty-state">
                <Globe2 size={32} />
                <p>Chưa có bài đăng nào.</p>
              </div>
            ) : (
              <div className="profile-posts-list">
                {businessPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onReact={reactToPost}
                    onOpenComments={(p) => setCommentingPost(p)}
                    onTogglePin={togglePin}
                    onToggleSave={toggleSave}
                    onHide={hidePost}
                    onDeletePost={deletePost}
                    onShowNotice={showNotice}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Cơ hội (Published Jobs) */}
        {activeTab === "jobs" && (
          <div className="profile-tab-panel" role="tabpanel" aria-label="Cơ hội việc làm đang mở">
            {publishedJobs.length === 0 ? (
              <div className="profile-empty-state">
                <BriefcaseBusiness size={32} />
                <p>Chưa có cơ hội việc làm nào đang mở.</p>
              </div>
            ) : (
              <div className="job-post-list">
                {publishedJobs.map((job) => (
                  <article className="job-post-row" key={job.id}>
                    <span className="job-post-mark">
                      <BriefcaseBusiness size={20} />
                    </span>
                    <div className="job-post-copy">
                      <div className="job-post-title-line">
                        <Link href={`/business/jobs/${job.id}`} className="job-post-title-link">
                          {job.title}
                        </Link>
                        <span className={`status-badge ${jobStatusTone(job.status)}`}>
                          <i />
                          {jobStatusLabels[job.status]}
                        </span>
                      </div>
                      <p>{job.summary}</p>
                      <div className="job-skill-list">
                        {job.skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                    </div>
                    <dl className="job-post-metrics">
                      <div>
                        <dt>Ngân sách</dt>
                        <dd>{budgetLabel(job)}</dd>
                      </div>
                      <div>
                        <dt>Ứng viên</dt>
                        <dd>{getJobApplicationCount(job.id)}</dd>
                      </div>
                      <div>
                        <dt>Hạn ứng tuyển</dt>
                        <dd>{formatDate(job.applicationDeadline)}</dd>
                      </div>
                    </dl>
                    <Link
                      href={`/business/jobs/${job.id}`}
                      className="icon-button job-row-action"
                      aria-label={`Xem chi tiết ${job.title}`}
                    >
                      <ArrowUpRight size={17} />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Giới thiệu (Business variant) */}
        {activeTab === "about" && (
          <div className="profile-tab-panel" role="tabpanel" aria-label="Giới thiệu doanh nghiệp">
            <div className="profile-about-card">
              <div className="about-section">
                <h3>Giới thiệu</h3>
                <p className="about-bio-text">{profile.bio}</p>
              </div>

              <div className="about-divider" />

              <div className="about-section">
                <h3>Lĩnh vực</h3>
                <p className="about-category-text">{profile.category}</p>
              </div>

              <div className="about-divider" />

              <div className="about-section">
                <h3>Thống kê</h3>
                <div className="about-stats-grid">
                  <div className="about-stat-item">
                    <span className="stat-value">{businessPosts.length}</span>
                    <span className="stat-label">bài đăng</span>
                  </div>
                  <div className="about-stat-item">
                    <span className="stat-value">{jobs.length}</span>
                    <span className="stat-label">cơ hội đã đăng</span>
                  </div>
                  <div className="about-stat-item">
                    <span className="stat-value">{hiredApplicants.length}</span>
                    <span className="stat-label">ứng viên đã tuyển</span>
                  </div>
                </div>
              </div>

              <div className="about-divider" />

              <div className="about-section">
                <h3>Vị trí đang mở</h3>
                <button
                  type="button"
                  className="open-positions-link-btn"
                  onClick={() => setActiveTab("jobs")}
                >
                  <span>
                    <strong>{publishedJobs.length} vị trí</strong> đang tuyển dụng
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="about-divider" />

              <div className="about-section">
                <h3>Xác minh doanh nghiệp</h3>
                <div className="verification-badges-list">
                  <div className="verification-badge-item verified">
                    <CheckCircle2 size={16} />
                    <span>Email đã xác minh</span>
                  </div>
                  <div className="verification-badge-item verified">
                    <CheckCircle2 size={16} />
                    <span>Danh tính tổ chức đã xác minh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Hoạt động (Activity Timeline) */}
        {activeTab === "activity" && (
          <div className="profile-tab-panel" role="tabpanel" aria-label="Dòng thời gian hoạt động">
            <div className="profile-activity-card">
              {activities.length === 0 ? (
                <div className="profile-empty-state">
                  <Clock size={32} />
                  <p>Chưa có hoạt động nào được ghi nhận.</p>
                </div>
              ) : (
                <div className="profile-activity-timeline">
                  {activities.map((item) => {
                    const icon =
                      item.type === "job_published" ? (
                        <BriefcaseBusiness size={16} />
                      ) : item.type === "applicant_hired" ? (
                        <UserCheck size={16} />
                      ) : (
                        <Globe2 size={16} />
                      );

                    return (
                      <div className="activity-timeline-item" key={item.id}>
                        <div className={`activity-icon ${item.type}`}>{icon}</div>
                        <div className="activity-content">
                          <p className="activity-label">{item.label}</p>
                          <time className="activity-time">
                            {formatActivityTime(item.timestamp)}
                          </time>
                        </div>
                        {item.linkHref && (
                          <Link
                            href={item.linkHref}
                            className="activity-link-btn"
                            title="Xem chi tiết"
                          >
                            <ArrowUpRight size={15} />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="action-dialog-backdrop" onClick={() => setIsEditOpen(false)}>
          <div
            className="action-dialog-content profile-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="action-dialog-header profile-edit-header">
              <h2 id="edit-profile-title">Chỉnh sửa hồ sơ</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Đóng"
                onClick={() => setIsEditOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="profile-edit-body">
              <div className="form-group">
                <label>Hình ảnh hồ sơ</label>
                <div className="profile-media-preview-grid">
                  <div className="profile-media-preview-card">
                    <div className="profile-avatar-preview" aria-label="Xem trước avatar">
                      {profile.logoUrl ? <img src={profile.logoUrl} alt="Avatar hiện tại" onError={() => setProfile((current) => ({ ...current, logoUrl: undefined }))} /> : <Building2 size={28} strokeWidth={1.8} />}
                    </div>
                    <div className="profile-media-preview-copy">
                      <strong>Avatar</strong>
                      <span>PNG, JPG hoặc WebP</span>
                    </div>
                    <button type="button" className="business-secondary-button" onClick={() => avatarInputRef.current?.click()}>
                      <ImageUp size={16} />
                      Đổi avatar
                    </button>
                  </div>
                  <div className="profile-media-preview-card">
                    <div
                      className="profile-cover-preview"
                      aria-label="Xem trước ảnh nền"
                      style={profile.coverImageUrl ? { backgroundImage: `url(${profile.coverImageUrl})` } : undefined}
                    >
                      {!profile.coverImageUrl && <ImageUp size={22} />}
                    </div>
                    <div className="profile-media-preview-copy">
                      <strong>Ảnh nền</strong>
                      <span>PNG, JPG hoặc WebP</span>
                    </div>
                    <button type="button" className="business-secondary-button" onClick={() => coverInputRef.current?.click()}>
                      <ImageUp size={16} />
                      Đổi ảnh nền
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-name">Tên tổ chức</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-category">Lĩnh vực</label>
                <input
                  id="edit-category"
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="Fintech · Web3 · Remote-first"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-bio">Giới thiệu</label>
                <textarea
                  id="edit-bio"
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Mô tả về doanh nghiệp..."
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="business-secondary-button"
                  onClick={() => setIsEditOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="business-primary-button">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments Modal if clicking comments in posts tab */}
      {commentingPost && (
        <CommentModal
          post={commentingPost}
          isOpen={Boolean(commentingPost)}
          onClose={() => setCommentingPost(null)}
          onAddComment={(postId, content) => {
            addComment(postId, content);
            setCommentingPost((prev) =>
              prev ? { ...prev, comments: posts.find((p) => p.id === postId)?.comments || prev.comments } : null,
            );
          }}
          onAddReply={(postId, parentId, content, replyingToName) => {
            addReply(postId, parentId, content, replyingToName);
            setCommentingPost((prev) =>
              prev ? { ...prev, comments: posts.find((p) => p.id === postId)?.comments || prev.comments } : null,
            );
          }}
          onToggleLike={toggleCommentLike}
        />
      )}
    </div>
  );
}
