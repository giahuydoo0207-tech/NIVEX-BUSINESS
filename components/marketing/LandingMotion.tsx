"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { NivexLogo } from "@/components/ui/NivexLogo";
export function LandingNavigation() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="landing-signal">
        <span>Hạ tầng thanh toán cho đội ngũ toàn cầu</span>
        <span>Bản trải nghiệm trên Solana Devnet</span>
      </div>
      <header className="landing-nav">
        <Link
          href="/"
          className="brand-lockup"
          aria-label="NIVEX Business trang chủ"
        >
          <NivexLogo size={32} variant="plain" />
          <span>Business</span>
        </Link>
        <nav
          className={open ? "landing-links open" : "landing-links"}
          aria-label="Điều hướng chính"
          onClick={() => setOpen(false)}
        >
          <a href="#product">Sản phẩm</a>
          <a href="#solana">Core & Solana</a>
          <a href="#workflow">Quy trình</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="landing-nav-actions">
          <Link href="/business/login">Đăng nhập</Link>
          <Link href="/business/register" className="business-primary-button">
            Đăng ký
            <ArrowUpRight size={16} />
          </Link>
          <button
            className="icon-button menu-button"
            aria-label={open ? "Đóng menu" : "Mở menu"}
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
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
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
