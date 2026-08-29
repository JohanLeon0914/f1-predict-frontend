"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`site-header ${scrolled ? "site-header-scrolled" : ""}`}>
      <div className="site-header-inner mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
        <Link href="/" className="brand-mark"><span>Predict</span><span>Race</span></Link>
        <nav className={`site-nav ${menuOpen ? "site-nav-open" : ""}`} id="mobile-navigation">
          <Link className="nav-link" href="/races" onClick={() => setMenuOpen(false)}>Races</Link>
          <Link className="nav-link" href="/#how-it-works" onClick={() => setMenuOpen(false)}>How it works</Link>
          <Link className="nav-link" href="/#about" onClick={() => setMenuOpen(false)}>About</Link>
        </nav>
        <div className="header-actions">
          <Link className="header-cta" href="/races">Explore Races</Link>
          <button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="mobile-menu-button"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
