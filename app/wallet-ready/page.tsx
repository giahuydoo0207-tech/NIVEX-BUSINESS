import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { demoWallet } from "@/lib/demo-data";

export default function WalletReadyPage() {
  return (
    <PhoneShell>
      <div className="content centered">
        <div className="illustration" style={{ background: "#DCFCE7" }}>
          <Check size={48} color="#16A34A" />
        </div>
        <div style={{ textAlign: "center" }}>
          <h1 className="h1">Ví Nivex của bạn đã sẵn sàng</h1>
          <p className="muted">Bạn có thể nhận USDC Devnet và gửi tiền quốc tế.</p>
        </div>
        <div className="card" style={{ margin: "18px 0", textAlign: "center" }}>
          <div className="muted">Địa chỉ ví</div>
          <div className="mono" style={{ marginTop: 6, fontWeight: 700 }}>{demoWallet.displayAddress}</div>
          <button className="btn-secondary" style={{ marginTop: 14 }}>
            <Copy size={16} />
            Sao chép địa chỉ
          </button>
        </div>
        <div className="stack">
          <Link className="btn-primary" href="/home">Đi đến trang chủ</Link>
          <DemoNotice />
        </div>
      </div>
    </PhoneShell>
  );
}
