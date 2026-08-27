import Link from "next/link";
import { WalletCards } from "lucide-react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { BrandMark } from "@/components/ui/BrandMark";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { RouteArc } from "@/components/route-visual/RouteArc";

export default function OnboardingPage() {
  return (
    <PhoneShell>
      <div className="content centered">
        <div className="illustration">
          <RouteArc />
        </div>
        <div style={{ textAlign: "center" }}>
          <BrandMark />
          <h1 className="h1">Ví stablecoin cho hành trình quốc tế.</h1>
          <p className="muted">Biết trước tỷ giá, phí và số tiền địa phương bạn sẽ nhận được.</p>
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
