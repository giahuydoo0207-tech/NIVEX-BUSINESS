import type { ApplicationStatus } from "@/types/application";

export const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted: ["viewed", "shortlisted", "accepted", "rejected"],
  viewed: ["shortlisted", "accepted", "rejected"],
  shortlisted: ["interview", "accepted", "rejected"],
  interview: ["accepted", "rejected"],
  rejected: [],
  accepted: [],
  withdrawn: [],
};

export function canTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function updateApplicationStatus<
  T extends { status: ApplicationStatus; updatedAt?: string },
>(app: T, next: ApplicationStatus): T & { updatedAt: string } {
  if (!canTransition(app.status, next)) {
    throw new Error(`Không thể chuyển từ "${app.status}" sang "${next}"`);
  }
  return { ...app, status: next, updatedAt: new Date().toISOString() };
}

export const NEXT_ACTIONS: Record<
  ApplicationStatus,
  { label: string; next: ApplicationStatus; tone?: "primary" | "secondary" }[]
> = {
  submitted: [
    { label: "Đưa vào Shortlist", next: "shortlisted", tone: "secondary" },
    { label: "Nhận (Hired)", next: "accepted", tone: "primary" },
  ],
  viewed: [
    { label: "Đưa vào Shortlist", next: "shortlisted", tone: "secondary" },
    { label: "Nhận (Hired)", next: "accepted", tone: "primary" },
  ],
  shortlisted: [
    { label: "Mời phỏng vấn", next: "interview", tone: "secondary" },
    { label: "Nhận (Hired)", next: "accepted", tone: "primary" },
  ],
  interview: [
    { label: "Nhận (Hired)", next: "accepted", tone: "primary" },
  ],
  rejected: [],
  accepted: [],
  withdrawn: [],
};

export const statusCopy: Record<
  ApplicationStatus,
  { label: string; description: string; tone: string }
> = {
  submitted: {
    label: "Mới gửi",
    description: "Hồ sơ mới gửi, chờ đội ngũ xem xét",
    tone: "new",
  },
  viewed: {
    label: "Đang xem xét",
    description: "Đội ngũ đang đánh giá năng lực",
    tone: "review",
  },
  shortlisted: {
    label: "Shortlist",
    description: "Ứng viên tiềm năng cho dự án",
    tone: "shortlist",
  },
  interview: {
    label: "Phỏng vấn",
    description: "Đang trong vòng trao đổi phỏng vấn",
    tone: "interview",
  },
  accepted: {
    label: "Đã nhận",
    description: "Đã trúng tuyển và nhận việc",
    tone: "approved",
  },
  rejected: {
    label: "Từ chối",
    description: "Hồ sơ không phù hợp",
    tone: "rejected",
  },
  withdrawn: {
    label: "Đã rút hồ sơ",
    description: "Ứng viên đã chủ động rút hồ sơ",
    tone: "withdrawn",
  },
};
