"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { NivexLogo } from "@/components/ui/NivexLogo";
import type { LandingCopy, LandingLocale } from "@/lib/landing-copy";

export function LandingNavigation({
  locale,
  onLocaleChange,
  copy,
}: {
  locale: LandingLocale;
  onLocaleChange: (locale: LandingLocale) => void;
  copy: LandingCopy["navigation"];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="landing-signal">
        <span>{copy.signal}</span>
        <span>{copy.environment}</span>
      </div>
      <header className="landing-nav">
        <Link
          href="/"
          className="brand-lockup"
          aria-label={copy.homeLabel}
        >
          <NivexLogo size={32} variant="plain" />
          <span>Business</span>
        </Link>
        <nav
          className={open ? "landing-links open" : "landing-links"}
          aria-label={copy.ariaLabel}
          onClick={() => setOpen(false)}
        >
          <a href="#product">{copy.product}</a>
          <a href="#solana">{copy.solana}</a>
          <a href="#workflow">{copy.workflow}</a>
          <a href="#faq">{copy.faq}</a>
          <div className="mobile-nav-auth">
            <Link href="/business/login">{copy.login}</Link>
            <Link href="/business/register">{copy.register}</Link>
          </div>
        </nav>
        <div className="landing-nav-actions">
          <div
            className="landing-language-switch"
            role="group"
            aria-label={copy.languageLabel}
          >
            {(["vi", "en"] as const).map((option) => (
              <button
                type="button"
                className={locale === option ? "active" : undefined}
                aria-pressed={locale === option}
                onClick={() => onLocaleChange(option)}
                key={option}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>
          <Link href="/business/login">{copy.login}</Link>
          <Link href="/business/register" className="business-primary-button">
            {copy.register}
            <ArrowUpRight size={16} />
          </Link>
          <button
            className="icon-button menu-button"
            aria-label={open ? copy.closeMenu : copy.openMenu}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
    </>
  );
}
export function LandingMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            entry.target.classList.remove("is-visible");
          }
        }),
      { threshold: 0.06, rootMargin: "-4% 0px -4%" },
    );
    const elements = document.querySelectorAll(".reveal");
    elements.forEach((element) => {
      element.classList.add("motion-ready");
      observer.observe(element);
    });
    return () => {
      observer.disconnect();
      elements.forEach((element) => element.classList.remove("motion-ready"));
    };
  }, []);
  return null;
}
