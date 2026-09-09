import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@fontsource-variable/geist";
import "./redesign.css";
import "./landing.css";
import "./landing-scenes.css";

export const metadata: Metadata = {
  title: "NIVEX Business",
  description:
    "Cross-border invoice and USDC payment operations for modern teams.",
};

export const viewport: Viewport = {
  themeColor: "#146EF5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
