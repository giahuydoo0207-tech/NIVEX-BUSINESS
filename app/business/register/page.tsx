import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BusinessRegisterForm } from "@/components/business/BusinessRegisterForm";
import { NivexLogo } from "@/components/ui/NivexLogo";

export default function BusinessRegisterPage() {
  return (
    <main className="business-auth-page">
      <header className="business-auth-header">
        <Link href="/" className="business-auth-brand"><NivexLogo size={36} /><span>Business</span></Link>
        <Link href="/business/login" className="back-link"><ChevronLeft size={18} />Về đăng nhập</Link>
      </header>
      <BusinessRegisterForm />
    </main>
  );
}
