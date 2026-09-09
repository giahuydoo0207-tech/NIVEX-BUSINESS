"use client";

import { useEffect, useState } from "react";
import { demoJobs } from "@/lib/job-demo-data";
import { isJobPost } from "@/lib/jobs";
import type { JobPost } from "@/types/job";

export function useJobs() {
  const [jobs, setJobs] = useState<JobPost[]>(demoJobs);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
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
  }, []);

  return { jobs, storageError };
}
