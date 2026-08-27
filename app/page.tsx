import Link from "next/link";
import { WalletCards } from "lucide-react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { NivexLogo } from "@/components/ui/NivexLogo";
import { DemoNotice } from "@/components/ui/DemoNotice";

export default function OnboardingPage() {
  return (
    <PhoneShell>
      <div className="content centered">
        <div className="onboarding-logo">
          <NivexLogo size={112} layout="stacked" />
        </div>
        <div style={{ textAlign: "center" }}>
          <h1 className="h1">Chuyển tiền quốc tế, rõ ràng từ đầu.</h1>
          <p className="muted">Biết trước tỷ giá, phí và số tiền người nhận sẽ nhận được.</p>
        </div>
        <div className="stack" style={{ marginTop: 28 }}>
          <Link className="btn-primary" href="/wallet-ready">
            Tiếp tục với Google
          </Link>
          <p className="muted" style={{ margin: 0, textAlign: "center" }}>Nivex không lưu private key của bạn.</p>
          <Link className="btn-secondary" href="/wallet-ready">
            <WalletCards size={18} />
            Đã có ví Solana? Kết nối Phantom
          </Link>
          <DemoNotice />
        </div>
      </div>
    </PhoneShell>
  );
}
