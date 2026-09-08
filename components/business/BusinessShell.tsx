import Link from "next/link";
import {
  Building2,
  FileText,
  LayoutDashboard,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { NivexLogo } from "@/components/ui/NivexLogo";

const navigation = [
  { key: "dashboard", href: "/business/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { key: "contractors", href: "/business/contractors", label: "Nhân sự", icon: UsersRound },
  { key: "invoices", href: "/business/invoices/new", label: "Hóa đơn", icon: FileText },
];

type BusinessSection = "dashboard" | "contractors" | "invoices";

export function BusinessShell({ children, active }: { children: React.ReactNode; active: BusinessSection }) {
  return (
    <main className="business-app">
      <aside className="business-sidebar">
        <Link href="/business/dashboard" className="business-brand" aria-label="NIVEX Business">
          <NivexLogo size={34} />
          <span>Business</span>
        </Link>
        <div className="organization-switcher">
          <span className="organization-icon"><Building2 size={18} /></span>
          <span><strong>NIVEX Labs</strong><small>Devnet workspace</small></span>
        </div>
        <nav className="business-navigation" aria-label="Điều hướng doanh nghiệp">
          {navigation.map(({ key, href, label, icon: Icon }) => (
            <Link href={href} key={key} className={active === key ? "active" : undefined} aria-current={active === key ? "page" : undefined}><Icon size={19} /><span>{label}</span></Link>
          ))}
        </nav>
        <div className="business-network"><i />Solana Devnet</div>
      </aside>
      <section className="business-workspace">
        <header className="business-topbar">
          <div><strong>NIVEX Labs</strong><span>Không gian doanh nghiệp</span></div>
          <button className="wallet-connect" type="button" disabled title="Tích hợp Wallet Standard ở giai đoạn tiếp theo"><WalletCards size={18} />Ví chưa kết nối</button>
        </header>
        <div className="business-content">{children}</div>
      </section>
    </main>
  );
}
