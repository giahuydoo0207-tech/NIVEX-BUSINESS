"use client";

import { useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Overlay, useModal } from "./overlay";

interface Props {
  title: string;
  icon: ReactNode;
  tone: "danger" | "warning" | "primary";
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
  children: ReactNode;
}

/** Confirmation built on the shared action-dialog styles; Escape, X and the backdrop cancel. */
export function ConfirmDialog({ title, icon, tone, confirmLabel, busy, error, onConfirm, onClose, children }: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useModal(dialogRef, onClose, busy);

  return (
    <Overlay>
      <div className="action-dialog-backdrop replyn-backdrop" onClick={() => !busy && onClose()}>
        <div ref={dialogRef} className="action-dialog-content replyn-confirm" role="alertdialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
          <div className="action-dialog-header">
            <div className={`action-dialog-icon-wrap ${tone}`}>{icon}</div>
            <div className="replyn-confirm-text">
              <h3 id={titleId} className="action-dialog-title">{title}</h3>
              <div className="action-dialog-desc">{children}</div>
              {error && <p className="replyn-form-error" role="alert">{error}</p>}
            </div>
            <button type="button" className="action-dialog-close" onClick={onClose} disabled={busy} aria-label="Đóng">
              <X size={18} />
            </button>
          </div>
          <div className="action-dialog-footer">
            <button type="button" className="action-dialog-btn secondary" onClick={onClose} disabled={busy}>Hủy</button>
            <button type="button" className={`action-dialog-btn ${tone === "danger" ? "danger" : "primary"}`} onClick={onConfirm} disabled={busy} data-autofocus>
              {busy ? "Đang xử lý…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
