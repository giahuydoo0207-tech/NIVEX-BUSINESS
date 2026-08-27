import Link from "next/link";
import { Home, List, Settings, UserRound } from "lucide-react";

const items = [
  { href: "/home", label: "Trang chủ", icon: Home },
  { href: "/history", label: "Giao dịch", icon: List },
  { href: "/home", label: "Danh bạ", icon: UserRound },
  { href: "/home", label: "Cài đặt", icon: Settings },
];

export function BottomNav({ active }: { active: "home" | "history" }) {
  return (
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === "home" ? item.label === "Trang chủ" : item.label === "Giao dịch";
        return (
          <Link className={`nav-item ${isActive ? "active" : ""}`} href={item.href} key={item.label}>
            <Icon size={21} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
