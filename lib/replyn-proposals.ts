/**
 * Replyn proposals in Nova Business. A business proposes Replyn from a Nova conversation, the
 * candidate answers in Nova Mobile and only an accepted proposal has a Replyn workspace. The backend
 * enforces every rule below again; the client copy only gives instant feedback.
 */

export type ProposalStatus = "DRAFT" | "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED";

export interface ProposalMilestone {
  title: string;
  amount: number | null;
  /** yyyy-mm-dd */
  deadline: string | null;
}

export interface ReplynProposal {
  id: string;
  threadId: string;
  status: ProposalStatus;
  projectName: string;
  scope: string;
  deliverables: string[];
  revisionLimit: number | null;
  currency: string;
  totalAmount: number | null;
  startDate: string | null;
  deadline: string | null;
  reviewPeriodDays: number | null;
  milestones: ProposalMilestone[];
  notes: string;
  supersedesId: string | null;
  workspaceId: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
}

/** What the form edits; amounts stay strings until they are sent. */
export interface ProposalForm {
  projectName: string;
  scope: string;
  deliverables: string[];
  revisionLimit: string;
  currency: "USDC";
  totalAmount: string;
  startDate: string;
  deadline: string;
  reviewPeriodDays: string;
  milestones: { title: string; amount: string; deadline: string }[];
  notes: string;
}

export type FieldErrors = Record<string, string>;

export const SIMULATION_NOTICE =
  "Cấp vốn, giải ngân và phí hiện đang được mô phỏng. Nova và Replyn chưa giữ tiền thật.";

export const REPLYN_URL = (process.env.NEXT_PUBLIC_REPLYN_URL || "https://replyn-web.vercel.app").replace(/\/+$/, "");

export function workspaceUrl(workspaceId: string) {
  return `${REPLYN_URL}/workspace/${encodeURIComponent(workspaceId)}`;
}

export function emptyForm(): ProposalForm {
  return {
    projectName: "",
    scope: "",
    deliverables: [""],
    revisionLimit: "2",
    currency: "USDC",
    totalAmount: "",
    startDate: "",
    deadline: "",
    reviewPeriodDays: "3",
    milestones: [{ title: "", amount: "", deadline: "" }],
    notes: "",
  };
}

const text = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));

export function formFromProposal(p: ReplynProposal): ProposalForm {
  return {
    projectName: p.projectName,
    scope: p.scope,
    deliverables: p.deliverables.length ? [...p.deliverables] : [""],
    revisionLimit: text(p.revisionLimit),
    currency: "USDC",
    totalAmount: text(p.totalAmount),
    startDate: p.startDate ?? "",
    deadline: p.deadline ?? "",
    reviewPeriodDays: text(p.reviewPeriodDays),
    milestones: p.milestones.length
      ? p.milestones.map((m) => ({ title: m.title, amount: text(m.amount), deadline: m.deadline ?? "" }))
      : [{ title: "", amount: "", deadline: "" }],
    notes: p.notes,
  };
}

function number(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/** Request body for the backend; blank fields are sent as null so drafts can stay incomplete. */
export function payload(form: ProposalForm, supersedesId?: string | null) {
  return {
    projectName: form.projectName.trim(),
    scope: form.scope.trim(),
    deliverables: form.deliverables.map((d) => d.trim()).filter(Boolean),
    revisionLimit: number(form.revisionLimit),
    currency: form.currency,
    totalAmount: number(form.totalAmount),
    startDate: form.startDate || null,
    deadline: form.deadline || null,
    reviewPeriodDays: number(form.reviewPeriodDays),
    milestones: form.milestones.map((m) => ({ title: m.title.trim(), amount: number(m.amount), deadline: m.deadline || null })),
    notes: form.notes.trim(),
    supersedesId: supersedesId ?? null,
  };
}

const cents = (value: number) => Math.round(value * 100);
const validAmount = (value: number | null) =>
  value !== null && Number.isFinite(value) && value > 0 && value <= 1_000_000_000 && Math.abs(value * 100 - cents(value)) < 1e-6;

export function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Same rules as the backend. `complete` = sending; drafts only need a project name. */
export function validate(form: ProposalForm, complete: boolean): FieldErrors {
  const errors: FieldErrors = {};
  const body = payload(form);
  if (!body.projectName) errors.projectName = "Nhập tên dự án.";
  else if (body.projectName.length > 160) errors.projectName = "Tên dự án tối đa 160 ký tự.";
  if (body.scope.length > 4000) errors.scope = "Phạm vi tối đa 4.000 ký tự.";
  else if (complete && !body.scope) errors.scope = "Mô tả phạm vi công việc.";
  if (body.deliverables.some((d) => d.length > 300)) errors.deliverables = "Mỗi sản phẩm bàn giao tối đa 300 ký tự.";
  else if (body.deliverables.length > 20) errors.deliverables = "Tối đa 20 sản phẩm bàn giao.";
  else if (complete && body.deliverables.length === 0) errors.deliverables = "Thêm ít nhất một sản phẩm bàn giao.";

  const revisions = body.revisionLimit;
  if (revisions !== null && (!Number.isInteger(revisions) || revisions < 0 || revisions > 20)) errors.revisionLimit = "Số lần chỉnh sửa từ 0 đến 20.";
  else if (complete && revisions === null) errors.revisionLimit = "Nhập số lần chỉnh sửa.";

  const total = body.totalAmount;
  if (total !== null && !validAmount(total)) errors.totalAmount = "Ngân sách phải lớn hơn 0, tối đa 2 chữ số thập phân.";
  else if (complete && total === null) errors.totalAmount = "Nhập tổng ngân sách.";

  const today = todayIso();
  if (complete && !body.deadline) errors.deadline = "Chọn deadline.";
  else if (complete && body.deadline && body.deadline < today) errors.deadline = "Deadline không được ở quá khứ.";
  if (body.startDate && body.deadline && body.startDate > body.deadline) errors.startDate = "Ngày bắt đầu phải trước deadline.";

  const review = body.reviewPeriodDays;
  if (review !== null && (!Number.isInteger(review) || review < 1 || review > 30)) errors.reviewPeriodDays = "Thời gian nghiệm thu từ 1 đến 30 ngày.";
  else if (complete && review === null) errors.reviewPeriodDays = "Nhập thời gian nghiệm thu.";

  const milestones = body.milestones;
  if (milestones.length > 10) errors.milestones = "Tối đa 10 milestone.";
  else if (complete && milestones.length === 0) errors.milestones = "Thêm ít nhất một milestone.";
  let sum = 0;
  let amountsComplete = true;
  let previous: string | null = null;
  milestones.slice(0, 10).forEach((m, i) => {
    const key = `milestones.${i}.`;
    if (m.title.length > 160) errors[`${key}title`] = "Tên milestone tối đa 160 ký tự.";
    else if (complete && !m.title) errors[`${key}title`] = "Nhập tên milestone.";
    if (m.amount === null) {
      amountsComplete = false;
      if (complete) errors[`${key}amount`] = "Nhập số tiền.";
    } else if (!validAmount(m.amount)) {
      amountsComplete = false;
      errors[`${key}amount`] = "Số tiền phải lớn hơn 0, tối đa 2 chữ số thập phân.";
    } else {
      sum += cents(m.amount);
    }
    const due = m.deadline;
    if (!due) {
      if (complete) errors[`${key}deadline`] = "Chọn deadline.";
    } else if (body.startDate && due < body.startDate) {
      errors[`${key}deadline`] = "Deadline milestone phải sau ngày bắt đầu.";
    } else if (body.deadline && due > body.deadline) {
      errors[`${key}deadline`] = "Deadline milestone không được sau deadline dự án.";
    } else if (previous && due < previous) {
      errors[`${key}deadline`] = "Deadline phải theo thứ tự các milestone.";
    } else if (complete && due < today) {
      errors[`${key}deadline`] = "Deadline không được ở quá khứ.";
    }
    if (due) previous = due;
  });
  if (complete && total !== null && validAmount(total) && amountsComplete && milestones.length > 0 && sum !== cents(total)) {
    errors.milestones = `Tổng các milestone (${formatAmount(sum / 100)}) phải bằng tổng ngân sách (${formatAmount(total)}).`;
  }
  if (body.notes.length > 2000) errors.notes = "Ghi chú tối đa 2.000 ký tự.";
  return errors;
}

export function formatAmount(value: number | null | undefined, currency = "USDC") {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value)} ${currency}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-");
  return d && m && y ? `${d}/${m}/${y}` : value;
}

/** Card status for the business side. */
export function businessStatusLabel(status: ProposalStatus) {
  return {
    DRAFT: "Bản nháp",
    PENDING: "Đã gửi · Chờ freelancer xác nhận",
    ACCEPTED: "Đã chấp nhận · Mở Replyn",
    REJECTED: "Đã từ chối",
    CANCELLED: "Đã hủy",
    EXPIRED: "Đã hết hạn",
  }[status];
}

export function statusTone(status: ProposalStatus) {
  return { DRAFT: "neutral", PENDING: "warning", ACCEPTED: "success", REJECTED: "danger", CANCELLED: "neutral", EXPIRED: "neutral" }[status];
}

export type MenuAction = "create" | "continue" | "view" | "open" | "recreate";

/** The first menu item follows the latest proposal of the conversation. */
export function proposalMenuItem(proposals: ReplynProposal[]): { action: MenuAction; label: string; proposal?: ReplynProposal } {
  const latest = proposals.at(-1);
  const accepted = proposals.find((p) => p.status === "ACCEPTED");
  if (accepted) return { action: "open", label: "Mở workspace Replyn", proposal: accepted };
  if (!latest) return { action: "create", label: "Đề xuất Replyn" };
  switch (latest.status) {
    case "DRAFT":
      return { action: "continue", label: "Tiếp tục đề xuất Replyn", proposal: latest };
    case "PENDING":
      return { action: "view", label: "Xem đề xuất Replyn", proposal: latest };
    case "REJECTED":
      return { action: "recreate", label: "Tạo đề xuất Replyn mới", proposal: latest };
    default:
      return { action: "recreate", label: "Tạo lại đề xuất Replyn", proposal: latest };
  }
}

/** Error body of the proposal API: {status, message, errors?}. */
export interface ProposalApiError {
  status?: string;
  message?: string;
  errors?: FieldErrors;
}

export async function readApiError(response: Response): Promise<ProposalApiError> {
  try {
    const body = (await response.json()) as ProposalApiError;
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}
