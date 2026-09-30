export interface DevnetPayment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  description: string;
  dueDate: string;
  chain: string;
  recipient: string | null;
  mint: string | null;
  amountMinor: string;
  reference: string | null;
  status: string;
  signature: string | null;
  /** CONTRACTOR_WALLET, or LEGACY_DEMO for requests prepared before contractor wallets. */
  recipientKind?: string | null;
  tokenSymbol?: string;
}

export class DevnetApiError extends Error {
  readonly status: number;
  /** Stable backend error code, e.g. WALLET_NOT_CONFIGURED. */
  readonly code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "DevnetApiError";
    this.status = status;
    this.code = code;
  }
}

export async function devnetApi<T>(path: string, body?: unknown, key?: string): Promise<T> {
  const response = await fetch(`/api/devnet/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store", signal: AbortSignal.timeout(65000),
  });
  const value = await response.json().catch(() => ({}));
  if (!response.ok || response.status === 202) {
    throw new DevnetApiError(value.detail || value.message || (response.status === 202
      ? "Giao dich dang duoc xac nhan. Kiem tra lai, khong thanh toan lai."
      : `API ${response.status}`), response.status, typeof value.code === "string" ? value.code : undefined);
  }
  return value as T;
}
