"use client";
import { useEffect, useState } from "react";
import { demoInvoices, isInvoice } from "@/lib/portal-data";
import type { Invoice } from "@/types/invoice";
import { devnetApi } from "@/lib/devnet-api";
import { parseApiInvoices } from "@/lib/invoice-api";
const devnet = process.env.NEXT_PUBLIC_PAYMENT_MODE === "devnet";
export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(devnet ? [] : demoInvoices);
  const [storageError, setStorageError] = useState(false);
  const [loading, setLoading] = useState(devnet);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!devnet) return;
    let active = true;
    let pending = false;
    async function load() {
      if (pending) return;
      pending = true;
      try {
        const rows = parseApiInvoices(await devnetApi<unknown>("invoices"));
        if (active) { setInvoices(rows); setError(""); }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Không tải được hóa đơn.");
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    }
    void load();
    const refresh = () => { if (document.visibilityState === "visible") void load(); };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [revision]);
  useEffect(() => {
    if (devnet) return;
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
  return { invoices, storageError, loading, error, devnet, refresh: () => setRevision(value => value + 1) };
}
