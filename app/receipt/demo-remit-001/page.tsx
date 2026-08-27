import Link from "next/link";
import { Check, Share2 } from "lucide-react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { RouteArc } from "@/components/route-visual/RouteArc";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { demoRemittance } from "@/lib/demo-data";

export default function ReceiptPage() {
  return (
    <PhoneShell>
      <div className="content">
        <TopBar title="Biên lai" />
        <section className="receipt-card">
          <div className="receipt-hero">
            <div className="check-circle"><Check size={26} /></div>
            <h1 className="h2">Giao dịch hoàn tất</h1>
            <div className="money" style={{ fontSize: 30, fontWeight: 700 }}>150 AUD</div>
            <div className="muted">Hôm nay, 09:24</div>
          </div>
          <RouteArc />
          <div className="receipt-row"><span>Bạn gửi</span><strong className="mono">{demoRemittance.inputAmount} USDC</strong></div>
          <div className="receipt-row"><span>Người nhận dự kiến nhận</span><strong className="mono">150 AUD</strong></div>
          <div className="receipt-row"><span>Tỷ giá</span><strong className="mono">1 USDC = 1.52 AUD</strong></div>
          <div className="receipt-row"><span>Phí dịch vụ</span><strong className="mono">0.50 USDC</strong></div>
          <div className="receipt-row"><span>Phí mạng</span><strong className="mono">~0.0001 SOL</strong></div>
          <div className="receipt-row"><span>Settlement partner</span><strong>{demoRemittance.settlementPartnerName}</strong></div>
          <div className="receipt-row"><span>Payout status</span><strong>AUD payout simulated - Completed</strong></div>
          <div className="receipt-row"><span>Mã giao dịch blockchain</span><strong className="mono">{demoRemittance.transactionSignature}</strong></div>
        </section>
        <div className="stack" style={{ marginTop: 14 }}>
          <a className="btn-secondary" href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noreferrer">
            Xem trên Solana Explorer
          </a>
          <button className="btn-secondary"><Share2 size={17} />Chia sẻ biên lai</button>
          <DemoNotice />
          <Link className="btn-primary" href="/home">Về trang chủ</Link>
        </div>
      </div>
    </PhoneShell>
  );
}
