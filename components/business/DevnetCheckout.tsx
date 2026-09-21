"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { NivexLogo } from "@/components/ui/NivexLogo";
import { formatUsdc } from "@/lib/money";
import { devnetApi, DevnetApiError, type DevnetPayment } from "@/lib/devnet-api";
import { createWalletClient, simulatePayment, signPayment } from "@/lib/solana-payment";
import type { WalletState } from "@solana/kit-plugin-wallet";

const labels: Record<string, string> = { CREATED: "Chưa chuẩn bị", AWAITING_PAYMENT: "Chờ thanh toán",
  PAYMENT_DETECTED: "Đã xác nhận, đang chờ hoàn tất", PAID_ON_CHAIN: "Đã hoàn tất trên Devnet" };

export function DevnetCheckout({ paymentRequestId }: { paymentRequestId: string }) {
  const [payment, setPayment] = useState<DevnetPayment | null>(null);
  const [client, setClient] = useState<ReturnType<typeof createWalletClient> | null>(null);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof simulatePayment>> | null>(null);
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [staleSignature, setStaleSignature] = useState(false);
  const actionLock = useRef(false);
  const storageKey = `nova.devnet.signature.${paymentRequestId}`;

  useEffect(() => {
    const current = createWalletClient();
    setClient(current);
    setWallet(current.wallet.getState());
    const unsubscribe = current.wallet.subscribe(() => {
      setWallet(current.wallet.getState()); setPreview(null);
    });
    return () => { unsubscribe(); current[Symbol.dispose](); };
  }, []);

  useEffect(() => {
    let active = true;
    setPayment(null); setPreview(null); setSignature(""); setError(""); setStaleSignature(false);
    try { setSignature(localStorage.getItem(storageKey) || ""); } catch { /* Read-only storage is allowed until signing. */ }
    devnetApi<DevnetPayment>(`payment-requests/${paymentRequestId}`).then(p => {
      if (active) { setPayment(p); if (p.signature) setSignature(p.signature); }
    }).catch(e => { if (active) setError(String(e.message)); });
    return () => { active = false; };
  }, [paymentRequestId, storageKey]);

  const paid = payment?.status === "PAID_ON_CHAIN";
  useEffect(() => {
    if (!signature || paid || !payment) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    setStaleSignature(false);
    async function check() {
      if (actionLock.current) { timer = setTimeout(check, 1000); return; }
      setChecking(true);
      let retry = true;
      try {
        const updated = await devnetApi<DevnetPayment>(`payment-requests/${paymentRequestId}/verify`, { signature });
        if (!active) return;
        setPayment(updated); setError(""); setStaleSignature(false);
        retry = updated.status !== "PAID_ON_CHAIN";
      } catch (e) {
        if (!active) return;
        retry = !(e instanceof DevnetApiError) || e.status === 202 || e.status === 429 || e.status >= 500;
        if (!(e instanceof DevnetApiError && e.status === 202)) {
          setError(e instanceof Error ? e.message : "Chưa kiểm tra được giao dịch.");
        }
      }
      if (!active) return;
      if (retry && ++attempts < 24) timer = setTimeout(check, 5000);
      else {
        setChecking(false);
        if (retry) {
          setStaleSignature(true);
          setError("Chữ ký này chưa xuất hiện trên Devnet. Có thể RPC đã từ chối sau khi ví ký, hãy bỏ chữ ký và ký lại.");
        }
      }
    }
    timer = setTimeout(check, 1000);
    return () => { active = false; clearTimeout(timer); setChecking(false); };
  }, [signature, paid, paymentRequestId, !!payment]);

  async function act(action: () => Promise<void>) {
    if (actionLock.current) return;
    actionLock.current = true; setBusy(true); setError("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Thao tác thất bại."); }
    finally { actionLock.current = false; setBusy(false); }
  }

  async function verify() {
    const p = await devnetApi<DevnetPayment>(`payment-requests/${paymentRequestId}/verify`, { signature });
    setPayment(p); setStaleSignature(false);
  }

  function clearStaleSignature() {
    try { localStorage.removeItem(storageKey); } catch { /* Clearing local retry state is best effort. */ }
    setSignature(""); setPreview(null); setError(""); setStaleSignature(false);
  }

  const connected = wallet?.connected;
  return <main className="checkout-page">
    <header className="checkout-header">
      <Link href="/business/invoices" aria-label="Quay lại hóa đơn"><ArrowLeft size={20} /></Link>
      <NivexLogo size={30} variant="plain" /><span className="network-badge">Solana Devnet</span>
    </header>
    <div className="checkout-layout">
      <section className="checkout-invoice">
        <p className="eyebrow">THANH TOÁN THỬ NGHIỆM</p>
        <h1>{payment?.description || "Yêu cầu thanh toán Devnet"}</h1>
        <p>{payment?.invoiceNumber} {payment ? `· Hạn ${payment.dueDate}` : ""}</p>
        <div className="recipient-panel"><ShieldCheck size={24} /><div>
          <small>Ví nhận demo</small><strong style={{ overflowWrap: "anywhere" }}>{payment?.recipient || "Chuẩn bị yêu cầu để xác nhận ví nhận"}</strong>
        </div></div>
        <p className="checkout-warning">USDC Devnet là token thử nghiệm. Ví trả tiền cần khác ví nhận và có SOL Devnet để trả phí mạng.</p>
        {signature && <p style={{ overflowWrap: "anywhere" }}><a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank" rel="noreferrer">
          Xem giao dịch trên Solana Explorer <ExternalLink size={15} /></a><br />{signature}</p>}
      </section>
      <aside className="checkout-payment">
        <div className="checkout-total"><span>Tổng thanh toán</span><strong>{payment ? formatUsdc(payment.amountMinor) : "..."}</strong><small>USDC · Solana Devnet</small></div>
        <dl className="checkout-details"><div><dt>Trạng thái</dt><dd>{labels[payment?.status || ""] || "Đang tải"}</dd></div>
          <div><dt>Ví trả phí</dt><dd style={{ maxWidth: 240, overflowWrap: "anywhere" }}>{connected?.account.address || "Chưa kết nối"}</dd></div>
          <div><dt>Phí mạng và tạo tài khoản token</dt><dd>Ví trả tiền chi trả bằng SOL</dd></div>
        </dl>
        {error && <p className="form-error" role="alert">{error}</p>}
        {!payment && <button className="business-secondary-button wide" disabled={busy} onClick={() => act(async () => setPayment(await devnetApi(`payment-requests/${paymentRequestId}`)))}><RefreshCw size={18} /> Tải lại</button>}
        {payment && !payment.reference && <button className="business-primary-button wide" disabled={busy} onClick={() => act(async () => setPayment(await devnetApi(`payment-requests/${paymentRequestId}/prepare`, {})))}>Chuẩn bị thanh toán Devnet</button>}
        {payment?.reference && !signature && !paid && <>
          {!connected && wallet?.wallets.map(w => <button key={w.name} className="business-primary-button wide" disabled={busy} onClick={() => act(async () => { await client?.wallet.connect(w); })}><Wallet size={18} /> Kết nối {w.name}</button>)}
          {!connected && wallet?.wallets.length === 0 && <p>Mở trang bằng trình duyệt có Phantom hoặc trình duyệt trong ứng dụng Phantom.</p>}
          {connected && !preview && <button className="business-primary-button wide" disabled={busy} onClick={() => act(async () => {
            if (!connected.signer || !connected.supportedTransactionVersions.has(0)) throw new Error("Ví chưa hỗ trợ ký giao dịch Devnet này.");
            setPreview(await simulatePayment(payment, connected.signer));
          })}>Kiểm tra giao dịch</button>}
          {preview && <><p role="status">Mô phỏng thành công. Kiểm tra ví nhận và số tiền trước khi xác nhận trong Phantom.</p>
            <button className="business-primary-button wide" disabled={busy} onClick={() => act(async () => {
              if (client?.wallet.getState().connected?.account.address !== preview.payer) throw new Error("Ví đã thay đổi. Hãy kiểm tra lại.");
              const fresh = await devnetApi<DevnetPayment>(`payment-requests/${paymentRequestId}`);
              if (fresh.status !== "AWAITING_PAYMENT") { setPayment(fresh); setPreview(null); throw new Error("Trạng thái đã thay đổi. Tải lại yêu cầu."); }
              await signPayment(preview, sig => { localStorage.setItem(storageKey, sig); setSignature(sig); setPreview(null); });
            })}><Wallet size={18} /> Xác nhận và ký trong Phantom</button>
            <button className="business-secondary-button wide" disabled={busy} onClick={() => setPreview(null)}>Kiểm tra lại giao dịch</button></>}
          {connected && <button className="business-secondary-button wide" disabled={busy} onClick={() => act(async () => { await client?.wallet.disconnect(); setPreview(null); })}>Đổi ví</button>}
        </>}
        {signature && !paid && <button className="business-primary-button wide" disabled={busy || checking} onClick={() => act(verify)}><RefreshCw size={18} /> Kiểm tra xác nhận giao dịch</button>}
        {signature && !paid && staleSignature && <button className="business-secondary-button wide" disabled={busy} onClick={clearStaleSignature}>Bỏ chữ ký này và ký lại</button>}
        {checking && <p role="status">Đang chờ xác nhận giao dịch đã gửi trên Devnet...</p>}
        {paid && <p role="status"><ShieldCheck size={20} /> Backend đã xác minh thanh toán hoàn tất trên Devnet.</p>}
        {busy && <p role="status">Đang xử lý...</p>}
      </aside>
    </div>
  </main>;
}
