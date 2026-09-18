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

export function NivexMark({
  size = 96,
  variant = "tile",
  className,
}: NivexMarkProps) {
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
      aria-label="Nova"
    >
      {variant === "tile" && (
        <rect width="112" height="112" rx="22" fill="#EAF2FF" />
      )}
      <path
        d="M31 79V34.5C31 28.5 38.3 25.5 42.5 29.8L72.8 60.2C77 64.5 84.3 61.5 84.3 55.5V27"
        stroke="#146EF5"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="31"
        cy="79"
        r="10"
        fill={variant === "tile" ? "#EAF2FF" : "#F7F9FC"}
        stroke="#146EF5"
        strokeWidth="5"
      />
      <circle cx="84.3" cy="27" r="9" fill="#146EF5" />
    </svg>
  );
}

export function NivexWordmark({ size = 34, className }: NivexWordmarkProps) {
  return (
    <span
      className={className}
      style={{
        color: "inherit",
        fontFamily: "inherit",
        fontSize: size,
        fontWeight: 750,
        letterSpacing: 0,
        lineHeight: 1,
      }}
    >
      Nova
    </span>
  );
}

export function NivexLogo({
  size = 96,
  variant = "tile",
  layout = "horizontal",
  className,
}: NivexLogoProps) {
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: layout === "stacked" ? "column" : "row",
        alignItems: "center",
        gap: layout === "stacked" ? 14 : 18,
      }}
      aria-label="Nova"
    >
      <NivexMark size={size} variant={variant} />
      <NivexWordmark size={Math.max(22, Math.round(size * 0.34))} />
    </div>
  );
}
