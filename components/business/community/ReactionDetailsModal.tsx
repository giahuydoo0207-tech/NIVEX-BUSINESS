"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { POST_REACTIONS, REACTION_LIST } from "@/lib/community-constants";
import { CommunityPost, PostReactionType } from "@/types/community";

type ReactionEntry = {
  reaction: string;
  actor: {
    id: string;
    displayName: string;
    handle: string;
    headline: string;
    avatarUrl?: string | null;
  };
};

interface ReactionDetailsModalProps {
  post: CommunityPost;
  isOpen: boolean;
  onClose: () => void;
}

function asReactionType(value: string): PostReactionType | null {
  const key = value.toLowerCase() as PostReactionType;
  return key in POST_REACTIONS ? key : null;
}

export function ReactionDetailsModal({ post, isOpen, onClose }: ReactionDetailsModalProps) {
  const [entries, setEntries] = useState<ReactionEntry[]>([]);
  const [activeReaction, setActiveReaction] = useState<PostReactionType | "all">("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoading(true);
    setActiveReaction("all");

    void fetch(`/api/devnet/community/posts/${post.id}/reactions`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Reaction details unavailable");
        return response.json() as Promise<ReactionEntry[]>;
      })
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, post.id]);

  const visibleReactions = useMemo(
    () => REACTION_LIST.filter((reaction) => (post.reactionCounts?.[reaction.key] ?? 0) > 0),
    [post.reactionCounts]
  );
  const visibleEntries = activeReaction === "all"
    ? entries
    : entries.filter((entry) => asReactionType(entry.reaction) === activeReaction);

  if (!isOpen) return null;

  return (
    <div className="reaction-details-backdrop" onClick={onClose}>
      <section
        className="reaction-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reaction-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="reaction-details-header">
          <h2 id="reaction-details-title">Cảm xúc về bài viết</h2>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </header>

        <div className="reaction-details-tabs" role="tablist" aria-label="Lọc cảm xúc">
          <button
            type="button"
            className={activeReaction === "all" ? "active" : ""}
            onClick={() => setActiveReaction("all")}
          >
            Tất cả <span>{post.reactionCount}</span>
          </button>
          {visibleReactions.map((reaction) => {
            const Icon = reaction.icon;
            return (
              <button
                key={reaction.key}
                type="button"
                className={activeReaction === reaction.key ? "active" : ""}
                onClick={() => setActiveReaction(reaction.key)}
                title={reaction.label}
              >
                <Icon size={16} color={reaction.color} />
                <span>{post.reactionCounts?.[reaction.key] ?? 0}</span>
              </button>
            );
          })}
        </div>

        <div className="reaction-details-list">
          {isLoading ? (
            <p className="reaction-details-message">Đang tải danh sách tương tác...</p>
          ) : visibleEntries.length > 0 ? (
            visibleEntries.map((entry) => {
              const reaction = asReactionType(entry.reaction);
              const config = reaction ? POST_REACTIONS[reaction] : null;
              const Icon = config?.icon;
              return (
                <div className="reaction-person-row" key={`${entry.actor.id}-${entry.reaction}`}>
                  <div className="reaction-person-avatar">
                    {entry.actor.avatarUrl ? <img src={entry.actor.avatarUrl} alt="" /> : entry.actor.displayName.slice(0, 1)}
                  </div>
                  <div className="reaction-person-copy">
                    <strong>{entry.actor.displayName}</strong>
                    <span>{entry.actor.headline || `@${entry.actor.handle}`}</span>
                  </div>
                  {Icon && <Icon size={20} color={config?.color} aria-label={config?.label} />}
                </div>
              );
            })
          ) : (
            <p className="reaction-details-message">
              Danh sách tài khoản sẽ xuất hiện khi dữ liệu reaction được đồng bộ từ backend.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
