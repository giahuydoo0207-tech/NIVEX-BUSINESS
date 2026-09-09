import Link from "next/link";
import Image from "next/image";
import { BusinessLoginForm } from "@/components/business/BusinessLoginForm";
import { NivexLogo } from "@/components/ui/NivexLogo";
export default function BusinessLoginPage() {
  return (
    <main className="business-login-page">
      <section className="login-brand-panel">
        <Image
          className="auth-art"
          src="/images/payment-network.webp"
          alt=""
          fill
          sizes="(max-width: 760px) 768px, 1536px"
          priority
        />
        <Link href="/" className="brand-lockup">
          <NivexLogo size={32} variant="plain" />
          <span>Business</span>
        </Link>
        <div className="login-brand-copy">
          <h2>
            Công việc toàn cầu.
            <br />
            Thanh toán kết nối.
          </h2>
          <p>
            Một nơi để quản lý người nhận, hóa đơn và từng bước thanh toán của
            đội ngũ.
          </p>
        </div>
        <div className="login-network">
          NIVEX Business · Môi trường trải nghiệm Solana Devnet
        </div>
      </section>
      <section className="login-form-panel">
        <BusinessLoginForm />
      </section>
    </main>
  );
}
