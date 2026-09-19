"use client";

import { useState } from "react";
import { PublicProfileData } from "@/types/community";
import { EXAMPLE_PROFILES } from "@/lib/community-constants";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  MapPin,
  User,
  Users,
  X,
} from "lucide-react";

interface ProfileExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleFollow?: (handle: string) => void;
  followedHandles?: string[];
}

export function ProfileExplorerModal({
  isOpen,
  onClose,
  onToggleFollow,
  followedHandles = [],
}: ProfileExplorerModalProps) {
  const [selectedProfile, setSelectedProfile] =
    useState<PublicProfileData | null>(null);

  if (!isOpen) return null;

  const profileToShow = selectedProfile || EXAMPLE_PROFILES[0];

  return (
    <div className="comment-modal-backdrop" onClick={onClose}>
      <div
        className="profile-explorer-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="profile-explorer-header">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-primary" />
            <h3 className="profile-explorer-title">Khám phá hồ sơ</h3>
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

        {/* Content Layout: 2 Columns on desktop */}
        <div className="profile-explorer-grid">
          {/* Left Column: Profile Selector List */}
          <div className="profile-picker-list">
            <span className="profile-list-header">Hồ sơ nổi bật</span>
            {EXAMPLE_PROFILES.map((p) => {
              const isSelected = profileToShow.handle === p.handle;
              const isBusiness = p.kind === "business";

              return (
                <button
                  key={p.handle}
                  type="button"
                  className={`profile-picker-item ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => setSelectedProfile(p)}
                >
                  <div
                    className={`profile-avatar-circle ${
                      isBusiness ? "business" : "freelancer"
                    }`}
                  >
                    {isBusiness ? (
                      <Building2 size={16} />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <div className="profile-picker-meta">
                    <div className="profile-picker-name-row">
                      <span className="profile-name">{p.displayName}</span>
                      {p.isVerified && (
                        <CheckCircle2
                          size={13}
                          className="text-primary flex-shrink-0"
                        />
                      )}
                    </div>
                    <span className="profile-headline-preview">
                      {p.headline}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Card */}
          <div className="profile-detail-card">
            <div className="profile-detail-banner">
              <div
                className={`profile-detail-avatar ${
                  profileToShow.kind === "business" ? "business" : "freelancer"
                }`}
              >
                {profileToShow.kind === "business" ? (
                  <Building2 size={28} />
                ) : (
                  <User size={28} />
                )}
              </div>
            </div>

            <div className="profile-detail-body">
              <div className="profile-detail-name-row">
                <div>
                  <h4 className="profile-detail-name">
                    {profileToShow.displayName}
                  </h4>
                  <span className="profile-detail-handle">
                    @{profileToShow.handle}
                  </span>
                </div>
                {onToggleFollow && profileToShow.handle !== "nova.labs" && (
                  <button
                    type="button"
                    className={`follow-author-btn ${
                      followedHandles.includes(profileToShow.handle)
                        ? "following"
                        : ""
                    }`}
                    onClick={() => onToggleFollow(profileToShow.handle)}
                  >
                    {followedHandles.includes(profileToShow.handle)
                      ? "Đang theo dõi"
                      : "+ Theo dõi"}
                  </button>
                )}
              </div>

              <p className="profile-detail-headline">{profileToShow.headline}</p>

              <div className="profile-detail-location">
                <MapPin size={13} />
                <span>{profileToShow.location}</span>
              </div>

              <p className="profile-detail-bio">{profileToShow.bio}</p>

              {/* Tags */}
              <div className="profile-detail-tags">
                {profileToShow.tags.map((tag) => (
                  <span key={tag} className="profile-tag-chip">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="profile-detail-stats">
                {profileToShow.stats.map((s) => (
                  <div key={s.label} className="profile-stat-box">
                    <span className="stat-val">{s.value}</span>
                    <span className="stat-lbl">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Business Openings or Experiences */}
              {profileToShow.openings && profileToShow.openings.length > 0 && (
                <div className="profile-openings-section">
                  <span className="section-title">Cơ hội đang mở</span>
                  <div className="space-y-2 mt-2">
                    {profileToShow.openings.map((op) => (
                      <div key={op.title} className="opening-item">
                        <div className="flex items-center justify-between">
                          <strong className="opening-title">{op.title}</strong>
                          <span className="opening-type">{op.type}</span>
                        </div>
                        {op.description && (
                          <p className="opening-desc">{op.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
