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
            Kết nối tài năng.
            <br />
            Thanh toán minh bạch.
          </h2>
          <p>
            Tìm freelancer đã xác minh, đăng bài & cơ hội việc làm, quản lý invoice và thanh toán (mô phỏng) — tất cả trong một nơi.
          </p>
        </div>
        <div className="login-network">
          Nova Business · Môi trường trải nghiệm Solana Devnet
        </div>
      </section>
      <section className="login-form-panel">
        <BusinessLoginForm />
      </section>
    </main>
  );
}
