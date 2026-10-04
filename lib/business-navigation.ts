import {
  BriefcaseBusiness,
  Contact,
  FileText,
  Globe2,
  LayoutDashboard,
  MessagesSquare,
  UserCircle,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

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
      {
        key: "personalInfo",
        label: "Thông tin cá nhân",
        href: "/business/personal-info",
        icon: Contact,
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

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

/**
 * The person shown in the sidebar. Business Web has no member accounts yet, so
 * this is the only representative data that exists; fields it lacks (email,
 * phone, job title) are shown as not set rather than invented.
 */
export const BUSINESS_REPRESENTATIVE = {
  name: "Gia Huy",
  initials: "GH",
  role: "Quản trị viên",
} as const;
