/**
 * Business Nova ID + Nova Key, as returned by /api/v1/business/nova-credentials.
 * The plaintext key exists only in the issue response; callers keep it in
 * component state and drop it when the one-time dialog closes.
 */
export type NovaKeyStatus = "NOT_CREATED" | "ACTIVE" | "REVOKED";

export type NovaCredential = {
  organization: {
    id: string;
    handle: string;
    name: string;
    verified: boolean;
    avatarUrl: string | null;
  };
  novaId: string;
  novaIdIssuedAt: string;
  key: {
    status: NovaKeyStatus;
    hint: string | null;
    createdAt: string | null;
    lastUsedAt: string | null;
    revokedAt: string | null;
  };
  updatedAt: string;
};

export type IssuedNovaKey = {
  novaKey: string;
  credential: NovaCredential;
};

export const NOVA_CREDENTIALS_PATH = "business/nova-credentials";
export const NOVA_KEY_PATH = "business/nova-credentials/key";

export const novaKeyStatusLabels: Record<NovaKeyStatus, string> = {
  NOT_CREATED: "Chưa tạo",
  ACTIVE: "Đang hoạt động",
  REVOKED: "Đã thu hồi",
};

export function novaKeyStatusLabel(status: string): string {
  return status in novaKeyStatusLabels ? novaKeyStatusLabels[status as NovaKeyStatus] : "Không xác định";
}

/** Shows only the last characters the backend kept, e.g. "•••• A91F". */
export function maskedNovaKey(hint: string | null | undefined): string {
  return hint ? `•••• ${hint}` : "••••";
}

/** The most recent key event: issued, rotated or revoked. */
export function lastKeyChange(key: NovaCredential["key"]): string | null {
  const times = [key.createdAt, key.revokedAt].filter((value): value is string => Boolean(value));
  if (times.length === 0) return null;
  return times.reduce((latest, value) => (Date.parse(value) > Date.parse(latest) ? value : latest));
}

/**
 * The message to show when a public demo has frozen Nova Key changes (the proxy answers 403 with a
 * Vietnamese message while NOVA_KEY_ROTATION_DISABLED=true). Null for any other failure.
 */
export function novaKeyLockedMessage(error: unknown): string | null {
  if (!(error instanceof Error) || (error as { status?: unknown }).status !== 403) return null;
  // A bare 403 (e.g. the cross-origin guard) has no body, so the client falls back to "API 403".
  return error.message && !/^API \d+$/.test(error.message) ? error.message : null;
}

/** The first key needs no confirmation; replacing an active key does. */
export function issueKeyNeedsConfirmation(status: NovaKeyStatus): boolean {
  return status === "ACTIVE";
}

export function formatCredentialTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
