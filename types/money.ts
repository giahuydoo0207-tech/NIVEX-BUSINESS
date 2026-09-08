export type CurrencyCode = "USDC" | "VND";

/** Serialized integer minor units. Safe to pass through JSON and Server Components. */
export type MinorAmount = string;

export interface MoneyAmount {
  currency: CurrencyCode;
  minor: MinorAmount;
}
