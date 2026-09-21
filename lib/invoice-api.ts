import type { Invoice, InvoiceStatus } from "../types/invoice.ts";

const statuses = new Set<InvoiceStatus>([
  "DRAFT", "ISSUED", "AWAITING_PAYMENT", "PAYMENT_DETECTED", "PAID_ON_CHAIN",
  "SETTLEMENT_PENDING", "PAYOUT_PROCESSING", "PAID_OUT", "EXPIRED", "UNDERPAID",
  "OVERPAID", "WRONG_TOKEN", "MANUAL_REVIEW", "CANCELLED",
]);

export function parseApiInvoices(value: unknown): Invoice[] {
  if (!Array.isArray(value)) throw new Error("Invalid invoice response");
  return value.map(item => {
    if (!item || typeof item !== "object"
      || !["id", "organizationId", "contractorId", "invoiceNumber", "description"].every(key => typeof item[key] === "string")
      || typeof item.amountMinor !== "string" || !/^[1-9][0-9]*$/.test(item.amountMinor)
      || BigInt(item.amountMinor) > 18446744073709551615n || item.currency !== "USDC"
      || !statuses.has(item.status)
      || typeof item.createdAt !== "string" || !Number.isFinite(Date.parse(item.createdAt))
      || typeof item.dueDate !== "string" || !Number.isFinite(Date.parse(item.dueDate))
      || !(item.paymentRequestId === null || typeof item.paymentRequestId === "string")) {
      throw new Error("Invalid invoice response");
    }
    return {
      id: item.id, organizationId: item.organizationId, contractorId: item.contractorId,
      invoiceNumber: item.invoiceNumber, description: item.description,
      sourceAmountMinor: item.amountMinor, sourceCurrency: "USDC",
      status: item.status, dueDate: item.dueDate, createdAt: item.createdAt,
      paymentRequestId: item.paymentRequestId ?? "",
    };
  });
}

export function isPaidInvoice(status: InvoiceStatus) {
  return status === "PAID_ON_CHAIN" || status === "PAID_OUT";
}

export function isPendingInvoice(status: InvoiceStatus) {
  return status === "ISSUED" || status === "AWAITING_PAYMENT" || status === "PAYMENT_DETECTED";
}
