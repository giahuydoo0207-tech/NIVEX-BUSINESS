import type { MinorAmount } from "@/types/money";

export const USDC_DECIMALS = 6;

export type ParseAmountResult =
  | { ok: true; minor: MinorAmount }
  | { ok: false; message: string };

export function parseUsdcToMinor(rawValue: string): ParseAmountResult {
  const value = rawValue.trim();

  if (!value) {
    return { ok: false, message: "Nhập số USDC cần thanh toán." };
  }

  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(value)) {
    return {
      ok: false,
      message: "Số tiền phải lớn hơn 0 và có tối đa 6 chữ số thập phân.",
    };
  }

  const [whole, fraction = ""] = value.split(".");
  const minor = BigInt(whole) * 10n ** BigInt(USDC_DECIMALS)
    + BigInt(fraction.padEnd(USDC_DECIMALS, "0"));

  if (minor <= 0n) {
    return { ok: false, message: "Số tiền phải lớn hơn 0 USDC." };
  }

  return { ok: true, minor: minor.toString() };
}

export function formatMinorAmount(
  minorValue: MinorAmount,
  decimals: number,
  maximumFractionDigits = decimals,
): string {
  const minor = BigInt(minorValue);
  const scale = 10n ** BigInt(decimals);
  const whole = minor / scale;
  const fraction = (minor % scale).toString().padStart(decimals, "0");
  const visibleFraction = fraction
    .slice(0, maximumFractionDigits)
    .replace(/0+$/, "");
  const groupedWhole = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(whole);

  return visibleFraction ? `${groupedWhole}.${visibleFraction}` : groupedWhole;
}

export function formatUsdc(minorValue: MinorAmount): string {
  return `${formatMinorAmount(minorValue, USDC_DECIMALS)} USDC`;
}
