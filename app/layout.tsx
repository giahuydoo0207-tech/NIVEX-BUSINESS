import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@fontsource-variable/geist";
import "./redesign.css";
import "./landing.css";
import "./landing-scenes.css";

export const metadata: Metadata = {
  title: "Nova Business | Quy trình chi trả USDC rõ ràng",
  description:
    "Tạo yêu cầu, đối chiếu người nhận và theo dõi trạng thái chi trả USDC trong bản thử nghiệm Nova Business trên Solana Devnet.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
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
