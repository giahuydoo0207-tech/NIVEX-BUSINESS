"use client";

import { useEffect, useState, useCallback } from "react";
import { demoApplications } from "@/lib/application-demo-data";
import {
  normalizeApplicationStatus,
  updateApplicationStatus,
} from "@/lib/application-status";
import type { ApplicationStatus, CandidateApplication } from "@/types/application";

const STORAGE_KEY = "nivex.demo.applications";
const SYNC_EVENT = "nova:applications-updated";

function sanitizeAndMigrateApplications(
  rawList: unknown,
): CandidateApplication[] | null {
  if (!Array.isArray(rawList) || rawList.length === 0) return null;

  const sanitized: CandidateApplication[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== "object" || !item.id || !item.jobId) {
      return null;
    }

    const normalizedStatus = normalizeApplicationStatus(
      (item as { status?: unknown }).status,
    );
    if (!normalizedStatus) {
      return null;
    }

    const itemObj = item as CandidateApplication;
    let badge = itemObj.statusBadge;
    if (badge === "Shortlist" || badge === "Shortlisted") {
      badge = "Đã chọn";
    } else if (badge === "Đang xem xét") {
      badge = "Đang xem";
    } else if (badge === "Đã rút hồ sơ") {
      badge = "Đã rút";
    }

    sanitized.push({
      ...itemObj,
      status: normalizedStatus,
      statusBadge: badge,
    });
  }

  return sanitized;
}

export function useApplications() {
  const [applications, setApplications] = useState<CandidateApplication[]>(demoApplications);

  useEffect(() => {
    function loadFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const sanitized = sanitizeAndMigrateApplications(parsed);
          if (sanitized) {
            if (JSON.stringify(sanitized) !== raw) {
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
              } catch {
                /* ignore */
              }
            }
            setApplications(sanitized);
            return;
          }
        }
      } catch {
        /* ignore */
      }
      setApplications(demoApplications);
    }

    function handleCustomSync(event: Event) {
      const custom = event as CustomEvent<CandidateApplication[]>;
      if (custom.detail && Array.isArray(custom.detail)) {
        setApplications(custom.detail);
      } else {
        loadFromStorage();
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null) {
        loadFromStorage();
      }
    }

    // Initial sync
    loadFromStorage();

    window.addEventListener(SYNC_EVENT, handleCustomSync);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(SYNC_EVENT, handleCustomSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const updateStatus = useCallback(
    (applicationId: string, nextStatus: ApplicationStatus) => {
      setApplications((current) => {
        const target = current.find((app) => app.id === applicationId);
        if (!target) return current;

        const updatedTarget = updateApplicationStatus(target, nextStatus);
        const nextList = current.map((app) =>
          app.id === applicationId ? updatedTarget : app,
        );

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
        } catch {
          /* ignore quota */
        }

        // Dispatch custom event for same-tab instant synchronization
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(SYNC_EVENT, { detail: nextList }),
          );
        }

        return nextList;
      });
    },
    [],
  );

  const getJobApplicationCount = useCallback(
    (jobId: string) => {
      return applications.filter((app) => app.jobId === jobId).length;
    },
    [applications],
  );

  const getApplication = useCallback(
    (id: string) => {
      return applications.find((app) => app.id === id);
    },
    [applications],
  );

  return {
    applications,
    updateStatus,
    getJobApplicationCount,
    getApplication,
  };
}
