"use client";

import { useEffect, useState } from "react";
import { PostPrivacy } from "@/types/community";
import {
  AlertTriangle,
  Ban,
  Check,
  Globe2,
  Lock,
  Plus,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                            1. Confirm Delete Modal                         */
/* -------------------------------------------------------------------------- */
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="action-dialog-backdrop" onClick={onClose}>
      <div
        className="action-dialog-content max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div className="action-dialog-header">
          <div className="action-dialog-icon-wrap danger">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h3 id="delete-dialog-title" className="action-dialog-title">
              Xóa bài viết?
            </h3>
            <p className="action-dialog-desc">
              Bạn có chắc chắn muốn xóa bài viết này không? Bài viết sẽ bị xóa
              vĩnh viễn khỏi bảng tin và không thể hoàn tác.
            </p>
          </div>
          <button
            type="button"
            className="action-dialog-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="action-dialog-footer">
          <button
            type="button"
            className="action-dialog-btn secondary"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className="action-dialog-btn danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Trash2 size={16} />
            <span>Xóa bài viết</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            2. Confirm Block Modal                          */
/* -------------------------------------------------------------------------- */
interface ConfirmBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  authorHandle: string;
  authorName?: string;
}

export function ConfirmBlockModal({
  isOpen,
  onClose,
  onConfirm,
  authorHandle,
  authorName,
}: ConfirmBlockModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetName = authorName ? `${authorName} (@${authorHandle})` : `@${authorHandle}`;

  return (
    <div className="action-dialog-backdrop" onClick={onClose}>
      <div
        className="action-dialog-content max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="block-dialog-title"
      >
        <div className="action-dialog-header">
          <div className="action-dialog-icon-wrap danger">
            <Ban size={22} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h3 id="block-dialog-title" className="action-dialog-title">
              Chặn @{authorHandle}?
            </h3>
            <p className="action-dialog-desc">
              Bạn sẽ không nhìn thấy bất kỳ bài viết hoặc cập nhật nào từ{" "}
              <strong className="text-foreground">{targetName}</strong> trên bảng tin
              cộng đồng. Họ cũng không thể xem bài viết của bạn.
            </p>
          </div>
          <button
            type="button"
            className="action-dialog-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="action-dialog-footer">
          <button
            type="button"
            className="action-dialog-btn secondary"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className="action-dialog-btn danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Ban size={16} />
            <span>Chặn người dùng</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            3. Report Post Modal                            */
/* -------------------------------------------------------------------------- */
const REPORT_REASONS = [
  { id: "spam", label: "Spam hoặc quảng cáo gây phiền nhiễu" },
  { id: "fraud", label: "Lừa đảo, gian lận hoặc thông tin sai lệch" },
  { id: "inappropriate", label: "Nội dung phản cảm, không phù hợp" },
  { id: "harassment", label: "Quấy rối hoặc phát ngôn thù hằn" },
  { id: "other", label: "Lý do khác" },
];

interface ReportPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function ReportPostModal({
  isOpen,
  onClose,
  onSubmit,
}: ReportPostModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(
    REPORT_REASONS[0].label
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="action-dialog-backdrop" onClick={onClose}>
      <div
        className="action-dialog-content max-w-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
      >
        <div className="action-dialog-header">
          <div className="action-dialog-icon-wrap warning">
            <AlertTriangle size={22} className="text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 id="report-dialog-title" className="action-dialog-title">
              Báo cáo bài viết
            </h3>
            <p className="action-dialog-desc">
              Vui lòng chọn lý do bài viết này vi phạm tiêu chuẩn cộng đồng của Nova:
            </p>
          </div>
          <button
            type="button"
            className="action-dialog-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="action-dialog-body space-y-2 py-3">
          {REPORT_REASONS.map((r) => {
            const isSelected = selectedReason === r.label;
            return (
              <label
                key={r.id}
                className={`report-option-card ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedReason(r.label)}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={r.label}
                  checked={isSelected}
                  onChange={() => setSelectedReason(r.label)}
                  className="sr-only"
                />
                <div className={`radio-dot ${isSelected ? "checked" : ""}`}>
                  {isSelected && <div className="radio-dot-inner" />}
                </div>
                <span className="report-option-text">{r.label}</span>
              </label>
            );
          })}
        </div>

        <div className="action-dialog-footer">
          <button
            type="button"
            className="action-dialog-btn secondary"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className="action-dialog-btn primary"
            onClick={() => {
              onSubmit(selectedReason);
              onClose();
            }}
          >
            <span>Gửi báo cáo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            4. Privacy Modal                                */
/* -------------------------------------------------------------------------- */
const PRIVACY_OPTIONS: Array<{
  id: PostPrivacy;
  label: string;
  desc: string;
  icon: typeof Globe2;
}> = [
  {
    id: "public",
    label: "Công khai",
    desc: "Bất kỳ ai trên Nova Business & Freelance đều có thể nhìn thấy.",
    icon: Globe2,
  },
  {
    id: "followers",
    label: "Người theo dõi",
    desc: "Chỉ những đối tác hoặc người dùng đang theo dõi bạn mới có thể thấy.",
    icon: Users,
  },
  {
    id: "only_me",
    label: "Chỉ mình tôi",
    desc: "Chỉ bạn mới có quyền xem bài viết này trên trang cá nhân.",
    icon: Lock,
  },
];

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrivacy?: PostPrivacy;
  onSave: (privacy: PostPrivacy) => void;
}

export function PrivacyModal({
  isOpen,
  onClose,
  currentPrivacy = "public",
  onSave,
}: PrivacyModalProps) {
  const [selected, setSelected] = useState<PostPrivacy>(currentPrivacy);

  useEffect(() => {
    setSelected(currentPrivacy);
  }, [currentPrivacy, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="action-dialog-backdrop" onClick={onClose}>
      <div
        className="action-dialog-content max-w-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-dialog-title"
      >
        <div className="action-dialog-header">
          <div className="action-dialog-icon-wrap primary">
            <Lock size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 id="privacy-dialog-title" className="action-dialog-title">
              Chỉnh sửa quyền riêng tư
            </h3>
            <p className="action-dialog-desc">
              Chọn đối tượng có thể nhìn thấy bài viết này:
            </p>
          </div>
          <button
            type="button"
            className="action-dialog-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="action-dialog-body space-y-2 py-3">
          {PRIVACY_OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                className={`privacy-option-card ${isSelected ? "selected" : ""}`}
                onClick={() => setSelected(opt.id)}
              >
                <div className="privacy-option-icon">
                  <Icon size={18} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="privacy-option-title">{opt.label}</span>
                    {isSelected && (
                      <Check size={16} className="text-primary" />
                    )}
                  </div>
                  <p className="privacy-option-desc">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="action-dialog-footer">
          <button
            type="button"
            className="action-dialog-btn secondary"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className="action-dialog-btn primary"
            onClick={() => {
              onSave(selected);
              onClose();
            }}
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            5. Edit Post Modal                              */
/* -------------------------------------------------------------------------- */
interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  initialTopics?: string[];
  onSave: (content: string, topics: string[]) => void;
}

export function EditPostModal({
  isOpen,
  onClose,
  initialContent,
  initialTopics = [],
  onSave,
}: EditPostModalProps) {
  const [content, setContent] = useState(initialContent);
  const [topics, setTopics] = useState<string[]>(initialTopics);
  const [newTopic, setNewTopic] = useState("");

  useEffect(() => {
    setContent(initialContent);
    setTopics(initialTopics);
  }, [initialContent, initialTopics, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddTopic = () => {
    const trimmed = newTopic.trim().replace(/^#/, "");
    if (!trimmed) return;
    if (!topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
    }
    setNewTopic("");
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter((t) => t !== topic));
  };

  return (
    <div className="action-dialog-backdrop" onClick={onClose}>
      <div
        className="action-dialog-content max-w-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-dialog-title"
      >
        <div className="action-dialog-header">
          <div className="flex-1">
            <h3 id="edit-dialog-title" className="action-dialog-title">
              Chỉnh sửa bài viết
            </h3>
            <p className="action-dialog-desc">
              Cập nhật nội dung hoặc chủ đề của bài viết
            </p>
          </div>
          <button
            type="button"
            className="action-dialog-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="action-dialog-body py-3 space-y-4">
          <textarea
            className="edit-post-textarea"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nội dung bài viết..."
          />

          {/* Topics management */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Chủ đề gắn kèm:
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {topics.map((t) => (
                <span key={t} className="composer-topic-chip">
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(t)}
                    aria-label={`Xóa chủ đề ${t}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                className="edit-topic-input"
                placeholder="Thêm hashtag (ví dụ: Solana, Fintech)..."
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
              />
              <button
                type="button"
                className="edit-topic-add-btn"
                onClick={handleAddTopic}
              >
                <Plus size={14} />
                <span>Thêm</span>
              </button>
            </div>
          </div>
        </div>

        <div className="action-dialog-footer">
          <button
            type="button"
            className="action-dialog-btn secondary"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className="action-dialog-btn primary"
            disabled={!content.trim()}
            onClick={() => {
              onSave(content.trim(), topics);
              onClose();
            }}
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
