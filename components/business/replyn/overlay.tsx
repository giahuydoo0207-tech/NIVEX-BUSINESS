"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/**
 * Renders menus and dialogs outside the chat columns, but still inside `.business-app` so the active
 * theme's variables apply. `.business-app` has no transform or filter, so `position: fixed` children
 * are placed against the viewport and never take part in its grid.
 */
export function Overlay({ children }: { children: ReactNode }) {
  // Overlays only mount after a click, so the host is resolved on the first render and refs are
  // attached before the dialog's effects run.
  const [host] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.querySelector<HTMLElement>(".business-app") ?? document.body,
  );
  return host ? createPortal(children, host) : null;
}

let locks = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

/**
 * Locks page scrolling while a dialog is open and restores the previous inline styles exactly. The
 * scrollbar width is added as padding so the page behind does not shift sideways.
 */
export function useBodyScrollLock() {
  useLayoutEffect(() => {
    const body = document.body;
    if (locks++ === 0) {
      const gap = window.innerWidth - document.documentElement.clientWidth;
      saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
      if (gap > 0) body.style.paddingRight = `${(parseFloat(getComputedStyle(body).paddingRight) || 0) + gap}px`;
      body.style.overflow = "hidden";
    }
    return () => {
      if (--locks === 0 && saved) {
        body.style.overflow = saved.overflow;
        body.style.paddingRight = saved.paddingRight;
        saved = null;
      }
    };
  }, []);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal behaviour for a dialog element: page scroll lock, Escape to close (unless busy), Tab kept
 * inside the dialog, focus on open and back to the previously focused element on close.
 */
export function useModal(dialogRef: RefObject<HTMLElement | null>, onClose: () => void, busy = false) {
  useBodyScrollLock();
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  useEffect(() => {
    closeRef.current = onClose;
    busyRef.current = busy;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const initial = dialog?.querySelector<HTMLElement>("[data-autofocus]") ?? dialog?.querySelector<HTMLElement>(FOCUSABLE);
    initial?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!busyRef.current) {
          event.preventDefault();
          closeRef.current();
        }
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous?.isConnected) previous.focus();
    };
  }, [dialogRef]);
}
