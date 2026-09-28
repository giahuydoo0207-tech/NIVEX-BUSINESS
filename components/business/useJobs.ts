"use client";

import { useCallback, useEffect, useState } from "react";
import { demoJobs } from "@/lib/job-demo-data";
import { isJobPost } from "@/lib/jobs";
import { liveBackend, mapApiJob, workspaceRequest, type ApiJob } from "@/lib/workspace-api";
import type { JobPost } from "@/types/job";

const JOBS_UPDATED_EVENT = "nova:jobs-updated";

export function notifyJobsUpdated() {
  window.dispatchEvent(new Event(JOBS_UPDATED_EVENT));
}

export function useJobs() {
  // Live workspaces start empty so fixtures never appear as real jobs.
  const [jobs, setJobs] = useState<JobPost[]>(liveBackend ? [] : demoJobs);
  const [storageError, setStorageError] = useState(false);
  const [loading, setLoading] = useState(liveBackend);
  const [error, setError] = useState("");

  const loadLive = useCallback(async () => {
    try {
      const remote = await workspaceRequest<ApiJob[]>("business/jobs");
      setJobs(remote.map(mapApiJob));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được danh sách công việc.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (liveBackend) {
      void loadLive();
      window.addEventListener(JOBS_UPDATED_EVENT, loadLive);
      return () => window.removeEventListener(JOBS_UPDATED_EVENT, loadLive);
    }

    function load() {
      try {
        const local: JobPost[] = [];
        for (let index = 0; index < localStorage.length; index++) {
          const key = localStorage.key(index);
          if (!key?.startsWith("nivex.demo.job.")) continue;
          try {
            const value: unknown = JSON.parse(
              localStorage.getItem(key) ?? "null",
            );
            if (isJobPost(value)) local.push(value);
          } catch {
            /* Skip unreadable local demo records. */
          }
        }
        setJobs(
          [...local, ...demoJobs].sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
          ),
        );
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
    }

    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, [loadLive]);

  const changeStatus = useCallback(async (jobId: string, status: "PUBLISHED" | "PAUSED" | "CLOSED") => {
    if (!liveBackend) return false;
    try {
      const updated = mapApiJob(await workspaceRequest<ApiJob>(`business/jobs/${jobId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }));
      setJobs((current) => current.map((job) => (job.id === updated.id ? updated : job)));
      setError("");
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không cập nhật được trạng thái.");
      return false;
    }
  }, []);

  return { jobs, storageError, loading, error, refresh: loadLive, changeStatus };
}
