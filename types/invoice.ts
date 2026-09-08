import type { MinorAmount } from "@/types/money";

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_DETECTED"
  | "PAID_ON_CHAIN"
  | "SETTLEMENT_PENDING"
  | "PAYOUT_PROCESSING"
  | "PAID_OUT"
  | "EXPIRED"
  | "UNDERPAID"
  | "OVERPAID"
  | "WRONG_TOKEN"
  | "MANUAL_REVIEW"
  | "CANCELLED";

export interface InvoiceDraft {
  contractorId: string;
  description: string;
  sourceAmountMinor: MinorAmount;
  sourceCurrency: "USDC";
  dueDate: string;
}

export interface Invoice extends InvoiceDraft {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  paymentRequestId: string;
  status: InvoiceStatus;
  createdAt: string;
}
