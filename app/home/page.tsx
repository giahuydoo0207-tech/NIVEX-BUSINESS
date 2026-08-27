import Link from "next/link";
import { ArrowLeft, ArrowRight, Bell, ChevronDown, Clock3, MapPin, Plane, RotateCcw, Shield } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { demoWallet } from "@/lib/demo-data";

const shortcuts = [
  { label: "Gửi", href: "/remit", icon: ArrowRight },
  { label: "Nhận", href: "/wallet-ready", icon: ArrowLeft },
  { label: "Điểm đến", href: "/remit", icon: Plane },
  { label: "Lịch sử", href: "/history", icon: RotateCcw },
  { label: "Hướng dẫn", href: "/home", icon: Clock3 },
];

export default function HomePage() {
  return (
    <PhoneShell>
      <div className="content home-content">
        <header className="home-greeting">
          <div><span>Xin chào</span><strong>Linh</strong></div>
          <button className="header-bell" aria-label="Thông báo"><Bell size={21} /></button>
        </header>
        <section className="home-hero">
          <div className="hero-copy"><span>Xin chào,</span><strong>Linh</strong></div>
          <div className="balance-toggle"><i /><span>Ẩn số dư</span></div>
          <button className="hero-bell" aria-label="Thông báo"><Bell size={20} /></button>
          <div className="hero-route" aria-hidden="true">
            <svg viewBox="0 0 360 105" fill="none"><path d="M25 79 Q180 4 335 82" stroke="#6998FF" strokeWidth="2.5" strokeDasharray="5 8" /><circle cx="25" cy="79" r="7" fill="#2563EB" /><circle cx="335" cy="82" r="7" fill="#6366F1" /></svg>
            <Plane className="hero-plane" size={38} fill="currentColor" />
          </div>
        </section>
        <nav className="shortcut-panel" aria-label="Lối tắt">
          {shortcuts.map(({ label, href, icon: Icon }) => <Link className="shortcut" href={href} key={label}><span><Icon size={23} /></span>{label}</Link>)}
        </nav>
        <section className="real-balance-card">
          <div><span>Số dư thật</span><strong>{demoWallet.balanceUsdc.toFixed(2)} USDC</strong></div>
          <button>Hiển thị: AUD <ChevronDown size={17} /></button>
        </section>
        <Link className="btn-primary home-cta" href="/remit"><ArrowRight size={22} />Gửi tiền quốc tế</Link>
        <section className="payout-info"><span className="info-icon"><Shield size={21} /></span><div><strong>Payout AUD đang mô phỏng</strong><p>Môi trường Devnet — chưa có tiền thật được chuyển.</p></div></section>
        <Link className="destination-card" href="/remit">
          <div className="destination-title"><MapPin size={17} fill="currentColor" />Điểm đến của bạn</div>
          <div className="destination-main"><strong>100 USDC → 150 AUD</strong><span className="destination-chips"><i>USDC</i><i>AUD</i></span></div>
          <p>Gửi đến Australia · Payout AUD mô phỏng trên Devnet</p>
        </Link>
      </div>
      <BottomNav active="home" />
    </PhoneShell>
  );
}
