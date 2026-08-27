import Link from "next/link";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { TopBar } from "@/components/layout/TopBar";
import { RouteArc } from "@/components/route-visual/RouteArc";
import { remittanceId } from "@/lib/constants";

export default function QuotePage() {
  return (
    <PhoneShell>
      <div className="content quote-content">
        <TopBar title="Xem báo giá" backHref="/remit" />
        <section className="quote-card quote-card-reference">
          <RouteArc />
          <div className="expiry-label"><span>Tỷ giá được giữ trong</span><strong className="mono">00:47</strong></div>
          <div className="progress"><span /></div>
          <div className="quote-row"><span>Bạn gửi</span><strong className="mono">100 USDC</strong></div>
          <div className="quote-row"><span>Tỷ giá</span><strong className="mono">1 USDC = 1.5000 AUD</strong></div>
          <div className="quote-row compact"><span>Phí dịch vụ Nivex demo</span><strong className="mono">0.50 USDC</strong></div>
          <div className="quote-row compact"><span>Phí mạng Solana</span><strong className="mono">~0.0001 SOL</strong></div>
          <div className="quote-row needed"><span>Tổng USDC cần có</span><strong className="mono">100.50 USDC</strong></div>
          <div className="quote-row total"><span>Người nhận dự kiến nhận</span><strong>150 AUD</strong></div>
          <div className="quote-row reference-vnd"><span>Quy đổi tham khảo (VND)</span><strong className="mono">~2.487.500 đ</strong></div>
        </section>
        <Link className="btn-primary quote-continue" href={`/processing/${remittanceId}`}>Tiếp tục</Link>
        <p className="quote-disclaimer">Bạn tự ký giao dịch. Nivex không can thiệp vào tài sản của bạn. Payout AUD đang mô phỏng trên Devnet.</p>
      </div>
    </PhoneShell>
  );
}
