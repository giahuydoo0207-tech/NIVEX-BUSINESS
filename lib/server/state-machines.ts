import type { InvoiceStatus } from "@/types/invoice";
import type { JobPostStatus } from "@/types/job";
import type { ApplicationStatus } from "@/types/application";

export const JOB_TRANSITIONS: Record<JobPostStatus, readonly JobPostStatus[]> = {
  DRAFT: ["PUBLISHED", "CLOSED"],
  PUBLISHED: ["PAUSED", "CLOSED"],
  PAUSED: ["PUBLISHED", "CLOSED"],
  CLOSED: [],
};

export const APPLICATION_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  submitted: ["viewed", "shortlisted", "accepted", "rejected", "withdrawn"],
  viewed: ["shortlisted", "accepted", "rejected", "withdrawn"],
  shortlisted: ["interview", "accepted", "rejected", "withdrawn"],
  interview: ["accepted", "rejected", "withdrawn"],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["AWAITING_PAYMENT", "CANCELLED", "EXPIRED"],
  AWAITING_PAYMENT: [
    "PAYMENT_DETECTED",
    "EXPIRED",
    "UNDERPAID",
    "OVERPAID",
    "WRONG_TOKEN",
    "MANUAL_REVIEW",
    "CANCELLED",
  ],
  PAYMENT_DETECTED: ["PAID_ON_CHAIN", "UNDERPAID", "OVERPAID", "WRONG_TOKEN", "MANUAL_REVIEW"],
  PAID_ON_CHAIN: ["SETTLEMENT_PENDING", "MANUAL_REVIEW"],
  SETTLEMENT_PENDING: ["PAYOUT_PROCESSING", "MANUAL_REVIEW"],
  PAYOUT_PROCESSING: ["PAID_OUT", "MANUAL_REVIEW"],
  PAID_OUT: [],
  EXPIRED: [],
  UNDERPAID: ["MANUAL_REVIEW", "CANCELLED"],
  OVERPAID: ["MANUAL_REVIEW", "CANCELLED"],
  WRONG_TOKEN: ["MANUAL_REVIEW", "CANCELLED"],
  MANUAL_REVIEW: ["CANCELLED", "AWAITING_PAYMENT"],
  CANCELLED: [],
};

export function canTransition<T extends string>(
  graph: Record<T, readonly T[]>,
  current: T,
  next: T,
) {
  return graph[current]?.includes(next) ?? false;
}

export function assertTransition<T extends string>(
  graph: Record<T, readonly T[]>,
  current: T,
  next: T,
) {
  if (!canTransition(graph, current, next)) {
    throw new Error(`Invalid transition: ${current} -> ${next}`);
  }
}
