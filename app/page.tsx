import LandingPageClient from "@/components/marketing/LandingPageClient";
import type { LandingLocale } from "@/lib/landing-copy";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const initialLocale: LandingLocale = lang === "en" ? "en" : "vi";

  return <LandingPageClient initialLocale={initialLocale} />;
}
