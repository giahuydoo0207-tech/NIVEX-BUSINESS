"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  FileCheck2,
  Globe2,
  Layers3,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { NivexLogo } from "@/components/ui/NivexLogo";
import {
  LandingMotion,
  LandingNavigation,
} from "@/components/marketing/LandingMotion";
import {
  CoreCapabilityGrid,
  HeroSystemScene,
  PaymentLifecycle,
  RecipientVerificationScene,
  SettlementScene,
  SolanaCoreGrid,
  WalletApprovalScene,
} from "@/components/marketing/TechScenes";
import {
  landingCopy,
  type LandingLocale,
} from "@/lib/landing-copy";

function MultilineTitle({ text }: { text: string }) {
  const [first, second] = text.split("\n");
  return (
    <>
      {first}
      {second ? (
        <>
          <br />
          {second}
        </>
      ) : null}
    </>
  );
}

export default function LandingPageClient({
  initialLocale,
}: {
  initialLocale: LandingLocale;
}) {
  const [locale, setLocale] = useState<LandingLocale>(initialLocale);
  const copy = landingCopy[locale];

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("lang");
    if (requested === "vi" || requested === "en") {
      setLocale(requested);
      return;
    }

    const saved = window.localStorage.getItem("nivex-language");
    if (saved === "vi" || saved === "en") {
      setLocale(saved);
      return;
    }
    setLocale(navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("nivex-language", locale);
    document.documentElement.lang = locale;
    document.title = copy.meta.title;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", locale);
    window.history.replaceState({}, "", url);
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", copy.meta.description);
  }, [copy.meta.description, copy.meta.title, locale]);

  return (
    <main className="landing">
      <LandingNavigation
        locale={locale}
        onLocaleChange={setLocale}
        copy={copy.navigation}
      />
      <section className="landing-hero">
        <HeroSystemScene locale={locale} />
        <div className="hero-copy">
          <span className="hero-kicker">{copy.hero.kicker}</span>
          <h1>
            {copy.hero.title}
            <br />
            <span>{copy.hero.titleAccent}</span>
          </h1>
          <p>{copy.hero.body}</p>
          <div className="hero-actions">
            <Link href="/business/register" className="business-primary-button">
              {copy.hero.primary}
              <ArrowUpRight size={18} />
            </Link>
            <Link href="/business/dashboard" className="hero-demo">
              {copy.hero.secondary}
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="hero-story-track" aria-label={copy.hero.trackLabel}>
          {copy.hero.track.map((item, index) => (
            <span className={index === 0 ? "active" : undefined} key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>
      <div className="platform-strip">
        <span>{copy.audiences.intro}</span>
        <strong><Building2 size={19} />{copy.audiences.items[0]}</strong>
        <strong><Layers3 size={19} />{copy.audiences.items[1]}</strong>
        <strong><Globe2 size={19} />{copy.audiences.items[2]}</strong>
        <strong><UsersRound size={19} />{copy.audiences.items[3]}</strong>
      </div>
      <section id="platform" className="landing-section story-section">
        <div className="landing-section-heading reveal">
          <h2><MultilineTitle text={copy.story.title} /></h2>
          <p>{copy.story.body}</p>
        </div>
        <div className="story-sequence">
          <article id="recipient-check" className="story-chapter reveal">
            <header>
              <span>{copy.story.chapters[0].eyebrow}</span>
              <h3>{copy.story.chapters[0].title}</h3>
              <p>{copy.story.chapters[0].body}</p>
            </header>
            <figure className="story-visual">
              <RecipientVerificationScene locale={locale} />
              <figcaption>{copy.story.chapters[0].caption}</figcaption>
            </figure>
          </article>
          <article id="wallet-approval" className="story-chapter reveal">
            <header>
              <span>{copy.story.chapters[1].eyebrow}</span>
              <h3>{copy.story.chapters[1].title}</h3>
              <p>{copy.story.chapters[1].body}</p>
            </header>
            <figure className="story-visual">
              <WalletApprovalScene locale={locale} />
              <figcaption>{copy.story.chapters[1].caption}</figcaption>
            </figure>
          </article>
          <article id="solana-settlement" className="story-chapter reveal">
            <header>
              <span>{copy.story.chapters[2].eyebrow}</span>
              <h3>{copy.story.chapters[2].title}</h3>
              <p>{copy.story.chapters[2].body}</p>
            </header>
            <figure className="story-visual">
              <SettlementScene locale={locale} />
              <figcaption>{copy.story.chapters[2].caption}</figcaption>
            </figure>
          </article>
        </div>
      </section>
      <section id="core" className="landing-section capability-section">
        <div className="landing-section-heading reveal">
          <h2><MultilineTitle text={copy.capabilities.title} /></h2>
          <p>{copy.capabilities.body}</p>
        </div>
        <CoreCapabilityGrid locale={locale} />
      </section>
      <section id="solana" className="landing-section solana-core-section">
        <div className="landing-section-heading reveal">
          <p className="eyebrow">{copy.solana.eyebrow}</p>
          <h2><MultilineTitle text={copy.solana.title} /></h2>
          <p>{copy.solana.body}</p>
        </div>
        <SolanaCoreGrid locale={locale} />
      </section>
      <section id="workflow" className="landing-section lifecycle-section">
        <div className="landing-section-heading reveal">
          <h2><MultilineTitle text={copy.workflow.title} /></h2>
          <p>{copy.workflow.body}</p>
        </div>
        <PaymentLifecycle locale={locale} />
      </section>
      <section id="product" className="landing-section product-section reveal">
        <div className="landing-section-heading">
          <h2><MultilineTitle text={copy.product.title} /></h2>
          <p>{copy.product.body}</p>
        </div>
        <Link
          className="product-preview"
          href="/business/dashboard"
          aria-label={copy.product.previewLabel}
        >
          <Image
            src="/images/dashboard-preview.webp"
            alt={copy.product.imageAlt}
            width={1440}
            height={1418}
            sizes="(max-width: 768px) 100vw, 1100px"
          />
          <span className="product-focus product-focus-invoices" aria-hidden="true">
            <small>01</small>{copy.product.focus[0]}
          </span>
          <span className="product-focus product-focus-recipients" aria-hidden="true">
            <small>02</small>{copy.product.focus[1]}
          </span>
          <span className="product-focus product-focus-status" aria-hidden="true">
            <small>03</small>{copy.product.focus[2]}
          </span>
        </Link>
        <div className="product-facts">
          <div>
            <FileCheck2 />
            <h3>{copy.product.facts[0].title}</h3>
            <p>{copy.product.facts[0].body}</p>
          </div>
          <div>
            <ShieldCheck />
            <h3>{copy.product.facts[1].title}</h3>
            <p>{copy.product.facts[1].body}</p>
          </div>
          <div>
            <WalletCards />
            <h3>{copy.product.facts[2].title}</h3>
            <p>{copy.product.facts[2].body}</p>
          </div>
        </div>
      </section>
      <section id="trust" className="landing-section trust-section reveal">
        <div className="landing-section-heading">
          <h2><MultilineTitle text={copy.trust.title} /></h2>
          <p>{copy.trust.body}</p>
        </div>
        <div className="trust-grid">
          <article>
            <ShieldCheck size={28} />
            <h3>{copy.trust.items[0].title}</h3>
            <p>{copy.trust.items[0].body}</p>
          </article>
          <article>
            <WalletCards size={28} />
            <h3>{copy.trust.items[1].title}</h3>
            <p>{copy.trust.items[1].body}</p>
          </article>
          <article>
            <FileCheck2 size={28} />
            <h3>{copy.trust.items[2].title}</h3>
            <p>{copy.trust.items[2].body}</p>
          </article>
          <article>
            <Layers3 size={28} />
            <h3>{copy.trust.items[3].title}</h3>
            <p>{copy.trust.items[3].body}</p>
          </article>
        </div>
      </section>
      <section id="faq" className="landing-section faq-section reveal">
        <div className="landing-section-heading">
          <h2><MultilineTitle text={copy.faq.title} /></h2>
          <p>{copy.faq.body}</p>
        </div>
        <div className="faq-list">
          {copy.faq.items.map(({ question, answer }) => (
            <details key={question}>
              <summary>
                {question}
                <span className="faq-plus">+</span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="landing-cta reveal">
        <Check size={28} />
        <h2><MultilineTitle text={copy.cta.title} /></h2>
        <p>{copy.cta.body}</p>
        <Link href="/business/register" className="business-primary-button">
          {copy.cta.action}
          <ArrowUpRight size={18} />
        </Link>
      </section>
      <footer className="landing-footer">
        <Link href="/" className="brand-lockup">
          <NivexLogo size={32} variant="plain" />
          <span>Business</span>
        </Link>
        <span>{copy.footer.tagline}</span>
        <nav aria-label={copy.footer.ariaLabel}>
          <a href="#faq">{copy.footer.faq}</a>
          <Link href="/business/login">{copy.footer.login}</Link>
        </nav>
        <small>{copy.footer.note}</small>
      </footer>
      <LandingMotion />
    </main>
  );
}
