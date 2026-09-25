"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  FileText,
  Globe2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Plus,
  UserCircle,
  UserRoundCheck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { NivexLogo } from "@/components/ui/NivexLogo";
import { PortalDialog } from "@/components/ui/PortalDialog";
import {
  DEFAULT_BUSINESS_THEME_ID,
  getInitialThemeId,
  isBusinessThemeId,
  setStoredThemeId,
  type BusinessThemeId,
} from "@/types/theme";
import { WorkspaceMenu } from "./WorkspaceMenu";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string | number;
}

export interface NavGroup {
  groupLabel?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: "Không gian làm việc",
    items: [
      {
        key: "dashboard",
        label: "Tổng quan",
        href: "/business/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    groupLabel: "Mạng lưới",
    items: [
      {
        key: "community",
        label: "Cộng đồng",
        href: "/business/community",
        icon: Globe2,
      },
      {
        key: "profile",
        label: "Trang cá nhân",
        href: "/business/profile",
        icon: UserCircle,
      },
      {
        key: "messages",
        label: "Tin nhắn",
        href: "/business/messages",
        icon: MessagesSquare,
        badge: 2,
      },
    ],
  },
  {
    groupLabel: "Tuyển dụng",
    items: [
      {
        key: "jobs",
        label: "Cơ hội việc làm",
        href: "/business/jobs",
        icon: BriefcaseBusiness,
        badge: "NEW",
      },
      {
        key: "applications",
        label: "Ứng viên",
        href: "/business/applications",
        icon: UserRoundCheck,
        badge: 3,
      },
    ],
  },
  {
    groupLabel: "Tài chính",
    items: [
      {
        key: "invoices",
        label: "Hóa đơn",
        href: "/business/invoices",
        icon: FileText,
        badge: "USDC",
      },
      {
        key: "contractors",
        label: "Nhân sự",
        href: "/business/contractors",
        icon: UsersRound,
      },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export function BusinessShell({
  children,
  active,
  breadcrumbLabel,
  activeAction,
  hideTopbar = false,
  initialTheme,
}: {
  children: React.ReactNode;
  active:
    | "dashboard"
    | "jobs"
    | "applications"
    | "messages"
    | "community"
    | "contractors"
    | "invoices"
    | "profile";
  breadcrumbLabel?: string;
  activeAction?: "newJob" | "newInvoice";
  hideTopbar?: boolean;
  initialTheme?: BusinessThemeId;
}) {
  const [menu, setMenu] = useState(false);
  const [themeId, setThemeId] = useState<BusinessThemeId>(
    initialTheme || DEFAULT_BUSINESS_THEME_ID
  );
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const [dialog, setDialog] = useState<
    "wallet" | "help" | "notifications" | null
  >(null);

  const handleSelectTheme = (newThemeId: BusinessThemeId) => {
    setThemeId(newThemeId);
    setStoredThemeId(newThemeId);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramTheme = params.get("theme");
    if (paramTheme && isBusinessThemeId(paramTheme)) {
      setThemeId(paramTheme);
      return;
    }
    const stored = getInitialThemeId();
    if (stored && stored !== DEFAULT_BUSINESS_THEME_ID) {
      setThemeId(stored);
    }
  }, []);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const savedScrollTop = window.sessionStorage.getItem(
      "nova-business-sidebar-scroll-top",
    );
    if (savedScrollTop) {
      sidebar.scrollTop = Number(savedScrollTop);
    }

    const rememberScroll = () => {
      window.sessionStorage.setItem(
        "nova-business-sidebar-scroll-top",
        String(sidebar.scrollTop),
      );
    };
    sidebar.addEventListener("scroll", rememberScroll, { passive: true });
    return () => sidebar.removeEventListener("scroll", rememberScroll);
  }, []);
  return (
    <div className={`business-app business-app-${active}`} data-theme={themeId}>
      <aside
        ref={sidebarRef}
        className={menu ? "business-sidebar sidebar-open" : "business-sidebar"}
      >
        <Link href="/" className="business-brand">
          <NivexLogo size={32} variant="plain" />
          <span>Business</span>
        </Link>
        <div className="organization-switcher-wrap">
          <button
            type="button"
            className={`organization-switcher ${workspaceMenuOpen ? "open" : ""}`}
            onClick={() => setWorkspaceMenuOpen((prev) => !prev)}
            aria-expanded={workspaceMenuOpen}
            aria-haspopup="dialog"
            aria-label="Cài đặt không gian làm việc và giao diện"
          >
            <span className="organization-icon">
              <Building2 size={19} />
            </span>
            <span>
              <strong>Nova Labs</strong>
              <small>Không gian thử nghiệm</small>
            </span>
            <ChevronDown
              size={15}
              className={`switcher-chevron ${workspaceMenuOpen ? "rotate" : ""}`}
            />
          </button>
          <WorkspaceMenu
            isOpen={workspaceMenuOpen}
            currentThemeId={themeId}
            onSelectTheme={handleSelectTheme}
            onClose={() => setWorkspaceMenuOpen(false)}
          />
        </div>
        <nav
          className="business-navigation"
          aria-label="Điều hướng doanh nghiệp"
        >
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={group.groupLabel ?? groupIdx} className="nav-group-section">
              {group.groupLabel && (
                <span className="nav-label">{group.groupLabel}</span>
              )}
              <div className="nav-group-items">
                {group.items.map(({ key, href, label, icon: Icon, badge }) => {
                  const isNavActive = active === key;
                  const navClassName =
                    isNavActive && activeAction === undefined ? "active" : undefined;
                  return (
                    <Link
                      key={key}
                      href={href}
                      className={navClassName}
                      aria-current={
                        isNavActive && activeAction === undefined ? "page" : undefined
                      }
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                      {badge !== undefined && (
                        <span
                          className={`nav-count ${key === "messages" ? "unread" : ""}`}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="sidebar-quick-actions">
          <Link
            href="/business/jobs/new"
            className={`sidebar-create ${activeAction === "newJob" ? "active" : ""}`}
          >
            <Plus size={17} />
            Đăng cơ hội
          </Link>
          <Link
            href="/business/invoices/new"
            className={`sidebar-create ${activeAction === "newInvoice" ? "active" : ""}`}
          >
            <FileText size={17} />
            Tạo hóa đơn
          </Link>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-environment">
            <span className="network-badge">
              <i />
              Solana Devnet
            </span>
            <p>Khám phá quy trình với dữ liệu minh họa.</p>
            <Link href="/">
              Tìm hiểu Nova
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
        {!hideTopbar && <header className="business-topbar">
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
              {breadcrumbLabel ??
                ALL_NAV_ITEMS.find((item) => item.key === active)?.label}
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
        </header>}
        <main className="business-content">{children}</main>
        <footer className="workspace-footer">
          <span>Nova Business</span>
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
              ? "Các bước để khám phá Nova Business."
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
              <li>Đăng cơ hội remote và xem số người phù hợp.</li>
              <li>Kiểm tra thông tin người nhận tại mục Nhân sự.</li>
              <li>Tạo hóa đơn với số USDC và hạn thanh toán.</li>
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
