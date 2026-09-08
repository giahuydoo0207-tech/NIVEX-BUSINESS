"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, WalletCards } from "lucide-react";
import { demoContractors, demoOrganization } from "@/lib/business-demo-data";
import { formatUsdc } from "@/lib/money";
import type { Invoice } from "@/types/invoice";

export function PaymentCheckout({ paymentRequestId }: { paymentRequestId: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    const serialized = localStorage.getItem(`nivex.demo.invoice.${paymentRequestId}`);
    if (serialized) setInvoice(JSON.parse(serialized) as Invoice);
    setLoaded(true);
  }, [paymentRequestId]);

  if (!loaded) {
    return <div className="checkout-state">Đang tải yêu cầu thanh toán...</div>;
  }

  if (!invoice) {
    return (
      <div className="checkout-state">
        <h1>Không tìm thấy yêu cầu thanh toán</h1>
        <p>Payment link thử nghiệm chỉ tồn tại trên trình duyệt đã tạo hóa đơn.</p>
        <Link className="business-primary-button" href="/business/invoices/new">Tạo hóa đơn mới</Link>
      </div>
    );
  }

  const contractor = demoContractors.find((item) => item.id === invoice.contractorId) ?? demoContractors[0];

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <Link href="/business/dashboard" aria-label="Quay lại dashboard"><ArrowLeft size={20} /></Link>
        <strong>NIVEX</strong>
        <span className="network-badge"><i />Devnet</span>
      </header>
      <div className="checkout-layout">
        <section className="checkout-invoice">
          <p className="eyebrow">YÊU CẦU THANH TOÁN</p>
          <h1>{invoice.description}</h1>
          <p className="checkout-meta">{invoice.invoiceNumber} · Hạn {new Intl.DateTimeFormat("vi-VN").format(new Date(invoice.dueDate))}</p>
          <div className="recipient-panel">
            <span className="recipient-avatar">{contractor.displayName.slice(0, 1)}</span>
            <div><small>Thanh toán cho</small><strong>{contractor.displayName}</strong><p>{contractor.role} · Việt Nam</p></div>
            <span className="identity-badge"><ShieldCheck size={15} />Đã xác minh</span>
          </div>
          <div className="invoice-disclosure">
            <h2>Thông tin được chia sẻ</h2>
            <p>NIVEX chỉ hiển thị thông tin người nhận đã đồng ý chia sẻ. Dữ liệu giấy tờ và tài khoản ngân hàng không được cung cấp cho người trả.</p>
          </div>
        </section>
        <aside className="checkout-payment">
          <div className="checkout-total"><span>Tổng thanh toán</span><strong>{formatUsdc(invoice.sourceAmountMinor)}</strong><small>USDC trên Solana Devnet</small></div>
          <dl className="checkout-details"><div><dt>Mạng</dt><dd>Solana Devnet</dd></div><div><dt>Token</dt><dd>USDC</dd></div><div><dt>Phí mạng</dt><dd>Hiển thị trong ví</dd></div><div><dt>Mã tham chiếu</dt><dd className="mono">{paymentRequestId.slice(-12)}</dd></div></dl>
          {!walletConnected ? (
            <button className="business-primary-button wide" type="button" onClick={() => setWalletConnected(true)}><WalletCards size={19} />Kết nối ví</button>
          ) : (
            <>
              <div className="connected-wallet"><CheckCircle2 size={18} /><span><small>Ví thử nghiệm đã kết nối</small><strong className="mono">7xK9...aP3L</strong></span></div>
              <button className="business-primary-button wide" type="button" disabled title="Sẽ hoạt động sau khi tích hợp Wallet Standard">Ký giao dịch: bước tiếp theo</button>
            </>
          )}
          <p className="checkout-warning">Prototype UI chưa phát giao dịch. Bước tích hợp tiếp theo sẽ dùng Wallet Standard và xác minh settlement ở backend.</p>
        </aside>
      </div>
      <footer className="checkout-footer"><span>{demoOrganization.tradingName}</span><span>Không yêu cầu seed phrase hoặc private key</span></footer>
    </main>
  );
}
