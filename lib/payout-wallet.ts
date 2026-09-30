/**
 * Contractor payout wallets as the backend reports them. The backend decides
 * readiness; the web only presents it and refuses to start a payment the
 * backend would reject anyway.
 */
export type PayoutReadiness = "READY" | "NOT_CONFIGURED" | "INVALID";

export const WALLET_NOT_CONFIGURED_MESSAGE = "Ứng viên chưa cấu hình ví nhận USDC trên Solana Devnet.";
export const WALLET_INVALID_MESSAGE =
  "Ví nhận tiền đã lưu của ứng viên không hợp lệ trên Solana Devnet. Ứng viên cần cập nhật lại ví.";

export interface ApiRecipient {
  contractorId: string;
  applicationId: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  jobTitle: string;
  applicationStatus: string;
  payoutReadiness: PayoutReadiness;
  walletAddress: string | null;
}

const readinessValues = new Set<PayoutReadiness>(["READY", "NOT_CONFIGURED", "INVALID"]);
const base58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Unknown readiness is treated as not ready; an address is only kept for READY rows. */
export function parseRecipients(value: unknown): ApiRecipient[] {
  if (!Array.isArray(value)) throw new Error("Invalid recipients response");
  return value.map((row) => {
    if (!row || typeof row !== "object" || typeof row.contractorId !== "string" || typeof row.displayName !== "string") {
      throw new Error("Invalid recipients response");
    }
    const readiness: PayoutReadiness = readinessValues.has(row.payoutReadiness) ? row.payoutReadiness : "INVALID";
    const address = typeof row.walletAddress === "string" && base58.test(row.walletAddress) ? row.walletAddress : null;
    const ready = readiness === "READY" && address !== null;
    return {
      contractorId: row.contractorId,
      applicationId: typeof row.applicationId === "string" ? row.applicationId : "",
      displayName: row.displayName,
      headline: typeof row.headline === "string" ? row.headline : null,
      avatarUrl: typeof row.avatarUrl === "string" ? row.avatarUrl : null,
      jobTitle: typeof row.jobTitle === "string" ? row.jobTitle : "",
      applicationStatus: typeof row.applicationStatus === "string" ? row.applicationStatus : "accepted",
      payoutReadiness: ready ? "READY" : readiness === "READY" ? "INVALID" : readiness,
      walletAddress: ready ? address : null,
    };
  });
}

export function readinessLabel(readiness: PayoutReadiness) {
  return readiness === "READY" ? "Đã cấu hình ví" : readiness === "INVALID" ? "Ví không hợp lệ" : "Chưa cấu hình ví";
}

/** Why a payment request cannot be created for this recipient, or null when it can. */
export function paymentBlockReason(recipient: { payoutReadiness?: PayoutReadiness } | null | undefined) {
  if (!recipient) return "Chọn người nhận hóa đơn.";
  if (recipient.payoutReadiness === "READY") return null;
  return recipient.payoutReadiness === "INVALID" ? WALLET_INVALID_MESSAGE : WALLET_NOT_CONFIGURED_MESSAGE;
}

/** Backend wallet error codes mapped to the message the business should see. */
export function walletErrorMessage(code: string | undefined, fallback: string) {
  if (code === "WALLET_NOT_CONFIGURED") return WALLET_NOT_CONFIGURED_MESSAGE;
  if (code === "WALLET_INVALID") return WALLET_INVALID_MESSAGE;
  return fallback;
}

export function shortAddress(address: string) {
  return address.length <= 12 ? address : `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function explorerTransactionUrl(signature: string) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(signature)) throw new Error("Invalid transaction signature");
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function explorerAddressUrl(address: string) {
  if (!base58.test(address)) throw new Error("Invalid address");
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}
