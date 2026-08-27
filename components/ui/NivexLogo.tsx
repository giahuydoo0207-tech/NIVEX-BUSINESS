import type { CSSProperties } from "react";

type MarkVariant = "tile" | "plain";
type LogoLayout = "horizontal" | "stacked";

export type NivexMarkProps = {
  size?: number;
  variant?: MarkVariant;
  className?: string;
};

export type NivexWordmarkProps = {
  size?: number;
  className?: string;
};

export type NivexLogoProps = {
  size?: number;
  variant?: MarkVariant;
  layout?: LogoLayout;
  className?: string;
};

export function NivexMark({ size = 96, variant = "tile", className }: NivexMarkProps) {
  const tileStyle: CSSProperties = {
    display: "block",
    width: size,
    height: size,
    flex: "0 0 auto",
  };

  return (
    <svg
      className={className}
      style={tileStyle}
      width={size}
      height={size}
      viewBox="0 0 112 112"
      fill="none"
      role="img"
      aria-label="Nivex"
    >
      {variant === "tile" && <rect width="112" height="112" rx="30" fill="#EEF2FF" />}
      <path
        d="M31 79V34.5C31 28.5 38.3 25.5 42.5 29.8L72.8 60.2C77 64.5 84.3 61.5 84.3 55.5V27"
        stroke="url(#nivex-route-gradient)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="31" cy="79" r="10" fill={variant === "tile" ? "#EEF2FF" : "#F7F9FC"} stroke="#2563EB" strokeWidth="5" />
      <circle cx="84.3" cy="27" r="9" fill="#6366F1" />
      <defs>
        <linearGradient id="nivex-route-gradient" x1="27" y1="31" x2="88" y2="77" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function NivexWordmark({ size = 34, className }: NivexWordmarkProps) {
  return (
    <span
      className={className}
      style={{ color: "#0F172A", fontFamily: "Sora, Inter, sans-serif", fontSize: size, fontWeight: 700, letterSpacing: "0.18em", lineHeight: 1 }}
    >
      NIVEX
    </span>
  );
}

export function NivexLogo({ size = 96, variant = "tile", layout = "horizontal", className }: NivexLogoProps) {
  return (
    <div
      className={className}
      style={{ display: "inline-flex", flexDirection: layout === "stacked" ? "column" : "row", alignItems: "center", gap: layout === "stacked" ? 14 : 18 }}
      aria-label="Nivex"
    >
      <NivexMark size={size} variant={variant} />
      <NivexWordmark size={Math.max(22, Math.round(size * 0.34))} />
    </div>
  );
}
