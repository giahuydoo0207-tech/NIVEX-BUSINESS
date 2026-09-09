"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Building2,
  ChevronDown,
  FileText,
  Globe2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { NivexLogo } from "@/components/ui/NivexLogo";
import { PortalDialog } from "@/components/ui/PortalDialog";

const navigation = [
  {
    key: "dashboard",
    href: "/business/dashboard",
    label: "Tổng quan",
    icon: LayoutDashboard,
  },
  {
    key: "invoices",
    href: "/business/invoices",
    label: "Hóa đơn",
    icon: FileText,
  },
  {
    key: "contractors",
    href: "/business/contractors",
    label: "Nhân sự",
    icon: UsersRound,
  },
];
export function BusinessShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "dashboard" | "contractors" | "invoices";
}) {
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState<
    "wallet" | "help" | "notifications" | null
  >(null);
  return (
    <div className={`business-app business-app-${active}`}>
      <aside
        className={menu ? "business-sidebar sidebar-open" : "business-sidebar"}
      >
        <Link href="/" className="business-brand">
          <NivexLogo size={32} variant="plain" />
          <span>Business</span>
        </Link>
        <div className="organization-switcher">
          <span className="organization-icon">
            <Building2 size={19} />
          </span>
          <span>
            <strong>NIVEX Labs</strong>
            <small>Không gian thử nghiệm</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <span className="nav-label">KHÔNG GIAN LÀM VIỆC</span>
        <nav
          className="business-navigation"
          aria-label="Điều hướng doanh nghiệp"
        >
          {navigation.map(({ key, href, label, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              className={active === key ? "active" : undefined}
              aria-current={active === key ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {key === "invoices" && <span className="nav-count">USDC</span>}
            </Link>
          ))}
        </nav>
        <Link href="/business/invoices/new" className="sidebar-create">
          <Plus size={17} />
          Tạo hóa đơn
        </Link>
        <div className="sidebar-bottom">
          <div className="sidebar-environment">
            <span className="network-badge">
              <i />
              Solana Devnet
            </span>
            <p>Khám phá quy trình với dữ liệu minh họa.</p>
            <Link href="/">
              Tìm hiểu NIVEX
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <button onClick={() => setDialog("help")}>
            <HelpCircle size={18} />
            Trợ giúp
          </button>
          <Link href="/business/login">
            <LogOut size={18} />
            Đăng xuất
          </Link>
          <div className="sidebar-profile">
            <span className="avatar">GH</span>
            <span>
              <strong>Gia Huy</strong>
              <small>Quản trị viên · Demo</small>
            </span>
          </div>
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-backdrop"
          aria-label="Đóng điều hướng"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="business-workspace">
        <header className="business-topbar">
          <div className="breadcrumb">
            <button
              className="icon-button menu-button"
              aria-label="Mở điều hướng"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={19} /> : <Menu size={19} />}
            </button>
            <Building2 size={16} />
            <span>Không gian làm việc</span>
            <span>/</span>
            <strong>
              {navigation.find((item) => item.key === active)?.label}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-label">Dữ liệu minh họa</span>
            <button
              className="wallet-connect"
              onClick={() => setDialog("wallet")}
            >
              <WalletCards size={17} />
              <span>Kết nối ví</span>
            </button>
            <button
              className="icon-button"
              title="Thông báo"
              aria-label="Thông báo"
              onClick={() => setDialog("notifications")}
            >
              <Bell size={18} />
            </button>
            <span className="avatar topbar-avatar">GH</span>
          </div>
        </header>
        <main className="business-content">{children}</main>
        <footer className="workspace-footer">
          <span>NIVEX Business</span>
          <span>
            <Globe2 size={13} />
            Solana Devnet · Không chuyển tiền thật
          </span>
        </footer>
      </div>
      <PortalDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title={
          dialog === "wallet"
            ? "Ví doanh nghiệp"
            : dialog === "help"
              ? "Trung tâm trợ giúp"
              : "Thông báo"
        }
        description={
          dialog === "wallet"
            ? "Kết nối ví đang ở chế độ trải nghiệm."
            : dialog === "help"
              ? "Các bước để khám phá NIVEX Business."
              : "Cập nhật trong không gian thử nghiệm."
        }
      >
        {dialog === "wallet" ? (
          <div className="dialog-body">
            <WalletCards size={36} />
            <p>
              Bạn có thể thử bước kết nối ví trong trang thanh toán của một hóa
              đơn. Bản hiện tại chưa kết nối ví thật hoặc yêu cầu ký giao dịch.
            </p>
            <Link
              className="business-primary-button"
              href="/business/invoices/new"
            >
              Tạo yêu cầu thanh toán
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : dialog === "help" ? (
          <div className="dialog-body">
            <ol>
              <li>Kiểm tra thông tin người nhận tại mục Nhân sự.</li>
              <li>Tạo hóa đơn với số USDC và hạn thanh toán.</li>
              <li>Mở trang thanh toán để xem lại và trải nghiệm kết nối ví.</li>
            </ol>
            <p>Hóa đơn bạn tạo được lưu trên trình duyệt này.</p>
            <Link className="business-secondary-button" href="/#faq">
              Câu hỏi thường gặp
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="empty-state">
            <Bell size={30} />
            <h3>Bạn đã xem hết thông báo</h3>
            <p>Chưa có cập nhật mới trong phiên trải nghiệm.</p>
          </div>
        )}
      </PortalDialog>
    </div>
  );
}
