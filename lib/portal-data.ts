import type { Invoice } from "@/types/invoice";
import { demoContractors } from "@/lib/business-demo-data";

export const demoInvoices: Invoice[] = Array.from({ length: 72 }, (_, day) => {
  const date = new Date(Date.UTC(2026, 6, 1 + day));
  return Array.from(
    { length: (Math.imul(day + 1, 2654435761) >>> 8) % 11 },
    (_, index) => {
      const contractor =
        demoContractors[(day + index) % demoContractors.length];
      const amount = BigInt(150 + ((day * 29 + index * 113) % 1850)) * 1000000n;
      const status: Invoice["status"] =
        day > 64 ? (index % 2 ? "AWAITING_PAYMENT" : "DRAFT") : "PAID_OUT";
      return {
        id: `sample-${day}-${index}`,
        organizationId: "org-nivex-demo",
        contractorId: contractor.id,
        description:
          index % 2
            ? "Thiết kế sản phẩm & bàn giao"
            : "Phát triển sản phẩm tháng " + (date.getUTCMonth() + 1),
        sourceAmountMinor: amount.toString(),
        sourceCurrency: "USDC" as const,
        dueDate: new Date(date.getTime() + 7 * 86400000)
          .toISOString()
          .slice(0, 10),
        invoiceNumber: `NOVA-2026-${String(day * 20 + index + 1).padStart(4, "0")}`,
        paymentRequestId: `sample-${day}-${index}`,
        status,
        createdAt: date.toISOString(),
      };
    },
  );
}).flat();

export function isInvoice(value: unknown): value is Invoice {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.paymentRequestId === "string" &&
    typeof item.invoiceNumber === "string" &&
    typeof item.description === "string" &&
    typeof item.contractorId === "string" &&
    typeof item.sourceAmountMinor === "string" &&
    /^\d+$/.test(item.sourceAmountMinor) &&
    BigInt(item.sourceAmountMinor) > 0n &&
    item.sourceCurrency === "USDC" &&
    typeof item.dueDate === "string" &&
    Number.isFinite(Date.parse(item.dueDate)) &&
    typeof item.createdAt === "string" &&
    Number.isFinite(Date.parse(item.createdAt)) &&
    typeof item.status === "string" &&
    Object.hasOwn(statusLabels, item.status)
  );
}

export const statusLabels: Record<Invoice["status"], string> = {
  DRAFT: "Bản nháp",
  ISSUED: "Đã tạo",
  AWAITING_PAYMENT: "Chờ thanh toán",
  PAYMENT_DETECTED: "Đã nhận giao dịch",
  PAID_ON_CHAIN: "Đã xác nhận",
  SETTLEMENT_PENDING: "Chờ đối soát",
  PAYOUT_PROCESSING: "Đang chi trả",
  PAID_OUT: "Hoàn tất",
  EXPIRED: "Hết hạn",
  UNDERPAID: "Thiếu tiền",
  OVERPAID: "Thừa tiền",
  WRONG_TOKEN: "Sai token",
  MANUAL_REVIEW: "Cần kiểm tra",
  CANCELLED: "Đã hủy",
};
export function statusTone(status: Invoice["status"]) {
  return status === "PAID_OUT" || status === "PAID_ON_CHAIN"
    ? "success"
    : status === "DRAFT" || status === "CANCELLED"
      ? "neutral"
      : "warning";
}
export function sumMinor(invoices: Invoice[]) {
  return invoices
    .reduce((sum, item) => sum + BigInt(item.sourceAmountMinor), 0n)
    .toString();
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
