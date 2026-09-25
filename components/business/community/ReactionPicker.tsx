"use client";

import { useState } from "react";
import { REACTION_LIST } from "@/lib/community-constants";
import { PostReactionType } from "@/types/community";

interface ReactionPickerProps {
  onSelect: (reaction: PostReactionType) => void;
  onClose?: () => void;
}

export function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  const [hoveredKey, setHoveredKey] = useState<PostReactionType | null>(null);
  const primaryReactions = REACTION_LIST.slice(0, 3);
  const secondaryReactions = REACTION_LIST.slice(3);

  const renderReaction = (r: (typeof REACTION_LIST)[number]) => {
    const Icon = r.icon;
    const isHovered = hoveredKey === r.key;

    return (
      <div key={r.key} className="reaction-picker-item-wrapper">
        {isHovered && (
          <div
            className="reaction-floating-tooltip"
            style={{ borderColor: r.color }}
          >
            {r.label}
          </div>
        )}
        <button
          type="button"
          className={`reaction-bubble-btn ${isHovered ? "hovered" : ""}`}
          style={{
            backgroundColor: isHovered ? r.color : "transparent",
            color: isHovered ? "#ffffff" : r.color,
          }}
          onMouseEnter={() => setHoveredKey(r.key)}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(r.key);
            onClose?.();
          }}
          title={r.label}
          aria-label={r.label}
        >
          <Icon size={isHovered ? 24 : 20} strokeWidth={2.2} />
        </button>
      </div>
    );
  };

  return (
    <div
      className="reaction-picker-pill"
      role="toolbar"
      aria-label="Chọn phản ứng"
      onMouseLeave={() => {
        setHoveredKey(null);
      }}
    >
      <div className="reaction-picker-row">{primaryReactions.map(renderReaction)}</div>
      <div className="reaction-picker-row reaction-picker-row-secondary">
        {secondaryReactions.map(renderReaction)}
      </div>
    </div>
  );
}
