// Every caller of the public devnet proxy acts with NOVA_DEMO_API_KEY, so a public deployment can freeze the
// Nova Key once it has been generated. Server-only; never expose this flag as NEXT_PUBLIC_.

export const NOVA_KEY_LOCKED_MESSAGE = "Tạo hoặc đổi Nova Key đang tạm khóa trên bản demo công khai.";

const UNLOCKED = new Set(["", "false", "0", "no", "off"]);

/**
 * Fails closed: unset or an explicit false/0/no/off keeps key changes open; any other value
 * (true, TRUE, 1, yes, or a typo) locks them.
 */
export function novaKeyRotationLocked(flag: string | undefined): boolean {
  return !UNLOCKED.has((flag ?? "").trim().toLowerCase());
}

/** Anything other than reading the status under business/nova-credentials changes the key. */
export function isNovaKeyChange(path: string, method: string): boolean {
  return /^business\/nova-credentials(?:\/|$)/.test(path) && method.toUpperCase() !== "GET";
}
