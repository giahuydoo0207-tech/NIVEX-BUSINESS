"use client";

import { useEffect, useRef } from "react";
import {
  BUSINESS_THEMES,
  type BusinessThemeId,
  type ThemeConfig,
} from "@/types/theme";
import {
  Building2,
  Check,
  Palette,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface WorkspaceMenuProps {
  isOpen: boolean;
  currentThemeId: BusinessThemeId;
  onSelectTheme: (themeId: BusinessThemeId) => void;
  onClose: () => void;
}

export function WorkspaceMenu({
  isOpen,
  currentThemeId,
  onSelectTheme,
  onClose,
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
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const themesList: ThemeConfig[] = Object.values(BUSINESS_THEMES);

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

      {/* Theme Section */}
      <div className="workspace-menu-section">
        <div className="workspace-menu-section-header">
          <div className="workspace-menu-section-title">
            <Palette size={14} />
            <span>ẢNH NỀN & GIAO DIỆN</span>
          </div>
          <span className="workspace-menu-section-hint">Đồng bộ Mobile</span>
        </div>

        <div className="workspace-theme-list" role="radiogroup" aria-label="Chọn chủ đề giao diện">
          {themesList.map((theme) => {
            const isSelected = theme.id === currentThemeId;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                data-theme-id={theme.id}
                aria-checked={isSelected}
                className={`workspace-theme-option ${isSelected ? "active" : ""}`}
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
              >
                {/* Visual 3-dot palette preview */}
                <div
                  className="workspace-theme-swatch"
                  aria-hidden="true"
                  style={{ backgroundColor: theme.swatch.background }}
                >
                  <span
                    className="swatch-dot primary"
                    style={{ backgroundColor: theme.swatch.primary }}
                  />
                  <span
                    className="swatch-dot surface"
                    style={{ backgroundColor: theme.swatch.surface }}
                  />
                  <span
                    className="swatch-dot border"
                    style={{ backgroundColor: theme.swatch.border }}
                  />
                </div>

                {/* Theme metadata */}
                <div className="workspace-theme-text">
                  <div className="workspace-theme-name-row">
                    <span className="workspace-theme-name">{theme.label}</span>
                    {theme.id === "cyberNight" && (
                      <span className="workspace-theme-tag">Mặc định</span>
                    )}
                  </div>
                  <p className="workspace-theme-desc">{theme.description}</p>
                </div>

                {/* Selection state */}
                <div className="workspace-theme-status">
                  {isSelected && (
                    <span className="workspace-theme-check" aria-hidden="true">
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
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
