import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { DemoNotice } from "@/components/ui/DemoNotice";

const states = [
  "User rejected transaction",
  "Insufficient USDC",
  "Insufficient SOL Devnet fee",
  "Quote expired",
  "Transaction failed",
  "Payout simulation failed",
  "Refunded",
];

export default function ProcessingPage() {
  return (
    <PhoneShell>
      <div className="content">
        <h1 className="h2" style={{ textAlign: "center", marginTop: 10 }}>Trạng thái giao dịch</h1>
        <div className="illustration" style={{ width: 74, height: 74, marginBottom: 10 }}>
          <Loader2 size={34} color="#6366F1" />
        </div>
        <p className="muted" style={{ textAlign: "center" }}>Mã giao dịch: <span className="mono">#NXV7...8K2F</span></p>

        <div className="steps">
          {[
            ["Đang xử lý giao dịch", "USDC đã rời khỏi ví của bạn - 09:21", "done"],
            ["Đã xác nhận trên Solana", "Giao dịch được xác nhận trên Devnet - 09:22", "done"],
            ["Payout AUD đang xử lý", "Đối tác demo đang mô phỏng payout", "active"],
            ["Hoàn tất", "Payout AUD mô phỏng hoàn tất", "wait"],
          ].map(([title, sub, tone]) => (
            <div className={`step ${tone === "done" ? "done" : ""}`} key={title}>
              <div className={`dot ${tone}`}>
                {tone === "done" ? <Check size={14} /> : null}
              </div>
              <div>
                <div className="step-title">{title}</div>
                <div className="step-sub">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <Link className="btn-primary" href="/receipt/demo-remit-001">Xem trạng thái hoàn tất</Link>

        <h2 className="h2" style={{ marginTop: 22 }}>Trạng thái khác</h2>
        <div className="state-grid">
          {states.map((state) => (
            <div className="state-card" key={state}>
              <strong>{state}</strong>
              <div className="muted">Hiển thị bằng card riêng, không ép vào stepper hoàn tất.</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}><DemoNotice /></div>
      </div>
    </PhoneShell>
  );
}
