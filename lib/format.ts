export function money(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: currency === "SOL" ? 5 : 2,
    minimumFractionDigits: currency === "AUD" ? 0 : 0,
  }).format(value)} ${currency}`;
}
