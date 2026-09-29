"use client";

import { useEffect, useState } from "react";
import { normalizeApplicationStatus } from "@/lib/application-status";
import { liveBackend, workspaceRequest, type ApiApplication } from "@/lib/workspace-api";

export const MESSAGES_UPDATED_EVENT = "nova:messages-updated";
const APPLICATIONS_UPDATED_EVENT = "nova:applications-updated";

type ThreadCount = { unreadForBusiness?: number };

export type LiveCounts = { applications: number; unreadMessages: number };

/** Sidebar counters read from the backend; null outside live mode or before the first load. */
export function useLiveCounts(): LiveCounts | null {
  const [counts, setCounts] = useState<LiveCounts | null>(null);

  useEffect(() => {
    if (!liveBackend) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [applications, pending, accepted] = await Promise.all([
          workspaceRequest<ApiApplication[]>("applications?limit=100"),
          workspaceRequest<ThreadCount[]>("messages?status=PENDING"),
          workspaceRequest<ThreadCount[]>("messages?status=ACCEPTED"),
        ]);
        if (cancelled) return;
        setCounts({
          applications: applications.filter(
            (item) => normalizeApplicationStatus(item.status) !== "withdrawn",
          ).length,
          // Each pending request is one unread item until it is accepted.
          unreadMessages:
            pending.length +
            accepted.reduce((sum, thread) => sum + (thread.unreadForBusiness ?? 0), 0),
        });
      } catch {
        // Keep the last known counts while the backend is unreachable.
      }
    };
    const loadWhenVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    void load();
    const interval = window.setInterval(loadWhenVisible, 15000);
    window.addEventListener("focus", loadWhenVisible);
    window.addEventListener(MESSAGES_UPDATED_EVENT, load);
    window.addEventListener(APPLICATIONS_UPDATED_EVENT, load);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", loadWhenVisible);
      window.removeEventListener(MESSAGES_UPDATED_EVENT, load);
      window.removeEventListener(APPLICATIONS_UPDATED_EVENT, load);
    };
  }, []);

  return counts;
}
