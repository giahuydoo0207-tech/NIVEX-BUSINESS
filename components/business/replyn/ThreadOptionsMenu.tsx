"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Ban, Bell, BellOff, ExternalLink, FilePen, FileSearch, MoreHorizontal, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import type { MenuAction } from "@/lib/replyn-proposals";

const PROPOSAL_ICON: Record<MenuAction, ReactNode> = {
  create: <ShieldCheck size={17} />,
  continue: <FilePen size={17} />,
  view: <FileSearch size={17} />,
  open: <ExternalLink size={17} />,
  recreate: <RotateCcw size={17} />,
};

interface Props {
  proposal: { action: MenuAction; label: string } | null;
  muted: boolean;
  blocked: boolean;
  onProposal: () => void;
  onToggleMute: () => void;
  onDelete: () => void;
  onBlock: () => void;
}

/**
 * The conversation's "..." menu. Closes on an outside click, on Escape (focus returns to the
 * trigger) and after a choice; it is anchored to the right edge so it never leaves a narrow screen.
 */
export function ThreadOptionsMenu({ proposal, muted, blocked, onProposal, onToggleMute, onDelete, onBlock }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not(:disabled)") ?? []);
      if (!items.length) return;
      event.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === "ArrowDown" ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
      items[next]?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]:not(:disabled)")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className="thread-options" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="icon-button"
        title="Tùy chọn"
        aria-label="Tùy chọn hội thoại"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="thread-options-menu" role="menu" aria-label="Tùy chọn hội thoại" ref={menuRef}>
          {proposal && (
            <button type="button" role="menuitem" className="thread-options-item primary" onClick={choose(onProposal)}>
              {PROPOSAL_ICON[proposal.action]}
              <span>{proposal.label}</span>
            </button>
          )}
          <button type="button" role="menuitem" className="thread-options-item" onClick={choose(onToggleMute)}>
            {muted ? <Bell size={17} /> : <BellOff size={17} />}
            <span>{muted ? "Bật thông báo" : "Tắt thông báo"}</span>
          </button>
          <div className="thread-options-separator" role="separator" />
          <button type="button" role="menuitem" className="thread-options-item danger" onClick={choose(onDelete)}>
            <Trash2 size={17} />
            <span>Xóa cuộc trò chuyện</span>
          </button>
          <button type="button" role="menuitem" className="thread-options-item danger" onClick={choose(onBlock)}>
            <Ban size={17} />
            <span>{blocked ? "Bỏ chặn ứng viên" : "Chặn ứng viên"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
