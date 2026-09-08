import { Building2, FileCheck2, ShieldCheck, UsersRound } from "lucide-react";
import { BusinessLoginForm } from "@/components/business/BusinessLoginForm";
import { NivexLogo } from "@/components/ui/NivexLogo";

const capabilities = [
  { icon: UsersRound, title: "Xác minh người nhận", copy: "Kiểm tra trạng thái contractor trước khi thanh toán." },
  { icon: FileCheck2, title: "Hóa đơn có đối soát", copy: "Mỗi giao dịch được liên kết với một payment reference riêng." },
  { icon: ShieldCheck, title: "Doanh nghiệp tự ký", copy: "NIVEX không yêu cầu seed phrase hoặc private key." },
];

export default function BusinessLoginPage() {
  return (
    <main className="business-login-page">
      <section className="login-brand-panel">
        <NivexLogo size={42} variant="plain" />
        <div className="login-brand-copy">
          <span className="login-brand-icon"><Building2 size={24} /></span>
          <p className="eyebrow">NIVEX BUSINESS</p>
          <h2>Thanh toán thu nhập xuyên biên giới, rõ ràng từ hóa đơn đến biên nhận.</h2>
          <p>Không gian vận hành dành cho doanh nghiệp trả USDC và contractor nhận payout VND.</p>
        </div>
        <div className="login-capabilities">
          {capabilities.map(({ icon: Icon, title, copy }) => <div key={title}><Icon size={19} /><span><strong>{title}</strong><small>{copy}</small></span></div>)}
        </div>
        <div className="login-network"><i />Solana Devnet · Prototype environment</div>
      </section>
      <section className="login-form-panel"><BusinessLoginForm /></section>
    </main>
  );
}
