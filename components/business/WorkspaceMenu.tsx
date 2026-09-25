"use client";

import { type RefObject, useEffect, useRef } from "react";
import {
  BUSINESS_THEMES,
  type BusinessThemeId,
  type ThemeConfig,
} from "@/types/theme";
import {
  Building2,
  Check,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface WorkspaceMenuProps {
  isOpen: boolean;
  currentThemeId: BusinessThemeId;
  onSelectTheme: (themeId: BusinessThemeId) => void;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function WorkspaceMenu({
  isOpen,
  currentThemeId,
  onSelectTheme,
  onClose,
  triggerRef,
}: WorkspaceMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, triggerRef]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef?.current?.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Use mousedown/touchstart for immediate responsive outside click
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const themesList: ThemeConfig[] = Object.values(BUSINESS_THEMES);
  const currentTheme = themesList.find((t) => t.id === currentThemeId) ?? themesList[0];

  return (
    <div
      ref={menuRef}
      className="workspace-menu-popover"
      role="dialog"
      aria-modal="false"
      aria-label="Cấu hình không gian làm việc & giao diện"
    >
      {/* Popover Header */}
      <div className="workspace-menu-header">
        <div className="workspace-menu-org">
          <span className="workspace-menu-org-icon">
            <Building2 size={16} />
          </span>
          <div className="workspace-menu-org-info">
            <strong>Nova Labs</strong>
            <span className="workspace-menu-env-tag">
              <i className="status-dot" />
              Solana Devnet
            </span>
          </div>
        </div>
        <div className="workspace-menu-badge">
          <ShieldCheck size={13} />
          <span>Môi trường thử nghiệm</span>
        </div>
      </div>

      <div className="workspace-menu-divider" />

      {/* Theme Section: Compact Swatches */}
      <div className="workspace-menu-section">
        {/* 1 Row of Circular Swatches ~26px */}
        <div className="workspace-theme-swatches-row" role="radiogroup" aria-label="Chọn chủ đề giao diện">
          {themesList.map((theme) => {
            const isSelected = theme.id === currentThemeId;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                data-theme-id={theme.id}
                aria-checked={isSelected}
                className={`workspace-swatch-circle-btn ${isSelected ? "active" : ""}`}
                title={`${theme.label} — ${theme.description}${theme.id === "cyberNight" ? " (Mặc định)" : ""}`}
                aria-label={`${theme.label}: ${theme.description}`}
                onClick={() => {
                  onSelectTheme(theme.id);
                }}
              >
                <span
                  className="workspace-swatch-circle"
                  style={{
                    background: `linear-gradient(135deg, ${theme.swatch.surface} 0%, ${theme.swatch.primary} 100%)`,
                  }}
                >
                  {isSelected && (
                    <span className="swatch-check-badge" aria-hidden="true">
                      <Check size={8} strokeWidth={3} />
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Theme Label */}
        <div className="workspace-theme-current-label">
          <span>Đang dùng: <strong>{currentTheme.label}</strong></span>
        </div>
      </div>

      {/* Footer info */}
      <div className="workspace-menu-footer">
        <Sparkles size={13} />
        <span>Giao diện tự động lưu trên trình duyệt của bạn</span>
      </div>
    </div>
  );
}
