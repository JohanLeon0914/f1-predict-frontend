"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`site-header ${scrolled ? "site-header-scrolled" : ""}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
        <Link href="/" className="brand-mark"><span>Predict</span><span>Race</span></Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link className="nav-link" href="/predicts">Predictions</Link>
          <Link className="nav-link" href="/races">Races</Link>
          <Link className="nav-link" href="/#how-it-works">How it works</Link>
          <Link className="nav-link" href="/#about">About</Link>
        </nav>
        <Link className="header-cta" href="/predicts">Explore Predictions</Link>
      </div>
    </header>
  );
}
