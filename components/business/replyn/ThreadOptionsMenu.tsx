"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Ban, Bell, BellOff, ExternalLink, FilePen, FileSearch, MoreHorizontal, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import type { MenuAction } from "@/lib/replyn-proposals";
import { Overlay } from "./overlay";

const PROPOSAL_ICON: Record<MenuAction, ReactNode> = {
  create: <ShieldCheck size={17} />,
  continue: <FilePen size={17} />,
  view: <FileSearch size={17} />,
  open: <ExternalLink size={17} />,
  recreate: <RotateCcw size={17} />,
};

const GAP = 6;
const EDGE = 8;

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
 * The conversation's "..." menu: a fixed popover anchored under the button, right edges aligned and
 * kept inside the viewport. It is portalled out of the chat header, so opening it never changes the
 * columns. Closes on an outside click, Escape or a choice; focus then returns to the button.
 */
export function ThreadOptionsMenu({ proposal, muted, blocked, onProposal, onToggleMute, onDelete, onBlock }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const left = Math.min(Math.max(EDGE, trigger.right - width), viewportWidth - width - EDGE);
    // Below the button when it fits, otherwise above it.
    const below = trigger.bottom + GAP;
    const top = below + height <= viewportHeight - EDGE ? below : Math.max(EDGE, trigger.top - GAP - height);
    setPosition({ top, left });
  }, []);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    setPosition(null);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "Tab") {
        close(false);
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? []);
      if (!items.length) return;
      event.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        event.key === "Home" ? 0
        : event.key === "End" ? items.length - 1
        : event.key === "ArrowDown" ? (index + 1) % items.length
        : (index - 1 + items.length) % items.length;
      items[next]?.focus();
    };
    const reposition = () => place();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, close, place]);

  // Focus the first item once the menu has its final position.
  useEffect(() => {
    if (open && position) menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
  }, [open, position]);

  const choose = (action: () => void) => () => {
    close();
    action();
  };

  return (
    <div className="thread-options">
      <button
        ref={triggerRef}
        type="button"
        className="icon-button"
        title="Tùy chọn"
        aria-label="Tùy chọn hội thoại"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <Overlay>
          <div
            className="thread-options-menu"
            role="menu"
            aria-label="Tùy chọn hội thoại"
            ref={menuRef}
            // Measured hidden first, then shown at its anchored position (no flash at 0,0).
            style={position ? { top: position.top, left: position.left } : { top: 0, left: 0, visibility: "hidden" }}
          >
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
        </Overlay>
      )}
    </div>
  );
}
