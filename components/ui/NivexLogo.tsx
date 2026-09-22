import type { CSSProperties } from "react";

export type MarkVariant = "tile" | "plain" | "onDark" | "onLight";
export type LogoLayout = "horizontal" | "stacked" | "markOnly";

export type NivexMarkProps = {
  size?: number;
  variant?: MarkVariant;
  className?: string;
};

export type NivexWordmarkProps = {
  size?: number;
  variant?: MarkVariant;
  className?: string;
};

export type NivexLogoProps = {
  size?: number;
  variant?: MarkVariant;
  layout?: LogoLayout;
  className?: string;
};

export function NivexMark({
  size = 32,
  variant = "plain",
  className,
}: NivexMarkProps) {
  const isTile = variant === "tile";
  const markStyle: CSSProperties = {
    display: "block",
    width: size,
    height: size,
    flex: "0 0 auto",
  };

  return (
    <svg
      className={className}
      style={markStyle}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Nova"
    >
      <defs>
        <linearGradient id="novaCyan" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#00F2FE" />
          <stop offset="100%" stopColor="#06D6D4" />
        </linearGradient>

        <linearGradient id="novaPurple" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="40%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>

        <linearGradient id="novaUpperBlue" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#0099FF" />
          <stop offset="50%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#004AD8" />
        </linearGradient>

        <linearGradient id="novaLowerBlue" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#0072FF" />
          <stop offset="100%" stopColor="#0044CC" />
        </linearGradient>
      </defs>

      {isTile && (
        <rect width="200" height="200" rx="44" fill="#071425" />
      )}

      {/* 1. Left Lower Pillar (Cyan) */}
      <circle cx="41" cy="146" r="19" fill="#00F2FE" />
      <path d="M 22 146 L 22 93 L 60 69 L 60 146 Z" fill="url(#novaCyan)" />

      {/* 2. Left Upper Facet (Purple) */}
      <path d="M 22 93 L 22 44 L 60 20 L 60 69 Z" fill="url(#novaPurple)" />

      {/* 3. Upper Diagonal Ribbon (Electric Blue) */}
      <path d="M 60 20 L 145 88 L 145 136 L 60 68 Z" fill="url(#novaUpperBlue)" />

      {/* 4. Lower Diagonal Bar (Deep Blue) */}
      <path d="M 68 100 L 145 161.6 L 145 188 L 68 126.4 Z" fill="url(#novaLowerBlue)" />

      {/* 5. Right Pillar (Cyan) */}
      <path d="M 145 24 L 178 24 L 178 161.6 L 145 188 Z" fill="url(#novaCyan)" />

      {/* 6. Top Right Circle (Lilac / Violet) */}
      <circle cx="161.5" cy="24" r="16.5" fill="#A78BFA" />
    </svg>
  );
}

export function NivexWordmark({
  size = 22,
  variant = "plain",
  className,
}: NivexWordmarkProps) {
  const textColor =
    variant === "onLight"
      ? "var(--foreground, #0B1220)"
      : variant === "onDark"
      ? "#FFFFFF"
      : "inherit";

  return (
    <span
      className={className}
      style={{
        color: textColor,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontSize: size,
        fontWeight: 700,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      Nova
    </span>
  );
}

export function NivexLogo({
  size = 32,
  variant = "plain",
  layout = "horizontal",
  className,
}: NivexLogoProps) {
  if (layout === "markOnly") {
    return <NivexMark size={size} variant={variant} className={className} />;
  }

  const wordmarkSize = Math.max(16, Math.round(size * 0.72));

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: layout === "stacked" ? "column" : "row",
        alignItems: "center",
        gap: layout === "stacked" ? 8 : 10,
      }}
      aria-label="Nova"
    >
      <NivexMark size={size} variant={variant} />
      <NivexWordmark size={wordmarkSize} variant={variant} />
    </div>
  );
}
