"use client";
import { useEffect, useState } from "react";
import { demoInvoices, isInvoice } from "@/lib/portal-data";
import type { Invoice } from "@/types/invoice";
export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(demoInvoices);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    function load() {
      try {
        const local: Invoice[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key?.startsWith("nivex.demo.invoice.")) continue;
          try {
            const item: unknown = JSON.parse(
              localStorage.getItem(key) || "null",
            );
            if (isInvoice(item)) local.push(item);
          } catch {
            /* Skip unreadable local drafts. */
          }
        }
        setInvoices(
          [...local, ...demoInvoices].sort((a, b) =>
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
  return { invoices, storageError };
}
