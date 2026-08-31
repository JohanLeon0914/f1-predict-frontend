"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const navItems = [
  { href: "/races", label: "Races", activePath: "/races" },
  { href: "/#how-it-works", label: "How it works", activePath: null },
  { href: "/#about", label: "About", activePath: null },
];

export function SiteHeader() {
  const { signInWithGoogle, signOutUser, user } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const userInitial =
    user?.user_metadata?.full_name?.slice(0, 1).toUpperCase() ??
    user?.email?.slice(0, 1).toUpperCase() ??
    "U";
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`site-header ${scrolled ? "site-header-scrolled" : ""}`}>
      <div className="site-header-inner mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
        <Link href="/" className="brand-logo" aria-label="Apex Predictor home">
          <Image
            alt="Apex Predictor"
            className="brand-logo-image"
            height={44}
            priority
            src="/icono-logo.png"
            width={132}
          />
        </Link>
        <nav className={`site-nav ${menuOpen ? "site-nav-open" : ""}`} id="mobile-navigation">
          {navItems.map((item) => (
            <Link
              aria-current={item.activePath && pathname === item.activePath ? "page" : undefined}
              className={`nav-link ${item.activePath && pathname === item.activePath ? "nav-link-active" : ""}`}
              href={item.href}
              key={item.href}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          {user ? (
            <button className="header-auth" onClick={signOutUser} type="button">
              <span className="user-avatar" aria-hidden="true">
                {userInitial}
              </span>
              Sign out
            </button>
          ) : (
            <button className="header-cta" onClick={signInWithGoogle} type="button">
              Sign in
            </button>
          )}
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
