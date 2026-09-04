"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useAuth } from "@/components/AuthProvider";
import { sports } from "@/lib/sports";

const navItems = [
  { href: "/#how-it-works", label: "How it works", activePath: null },
  { href: "/#who-we-are", label: "About", activePath: null },
  { href: "/support", label: "Support", activePath: "/support" },
];

function getContextualNavItems(pathname: string) {
  if (pathname.startsWith("/ufc") || pathname.startsWith("/events")) {
    return [
      { href: "/events", label: "Events", activePath: "/events" },
      { href: "/#who-we-are", label: "About", activePath: null },
      { href: "/support", label: "Support", activePath: "/support" },
    ];
  }

  if (pathname.startsWith("/f1") || pathname.startsWith("/races") || pathname.startsWith("/analysis")) {
    return [
      { href: "/races", label: "Races", activePath: "/races" },
      { href: "/analysis", label: "Analysis", activePath: "/analysis" },
      { href: "/#who-we-are", label: "About", activePath: null },
      { href: "/support", label: "Support", activePath: "/support" },
    ];
  }

  return navItems;
}

export function SiteHeader() {
  const { foundingSupporter, signInWithGoogle, signOutUser, user } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sportsMenuOpen, setSportsMenuOpen] = useState(false);
  const [isMobileNav, setIsMobileNav] = useState(false);
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
  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobileNav(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!menuOpen) setSportsMenuOpen(false);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setSportsMenuOpen(false);
  }, [pathname]);

  const headerNavItems = getContextualNavItems(pathname);

  return (
    <header className={`site-header ${scrolled ? "site-header-scrolled" : ""}`}>
      <div className="site-header-inner mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
        <Link href="/" className="brand-logo" aria-label="GRDX1 home">
          <Image
            alt="GRDX1"
            className="brand-logo-image"
            height={44}
            priority
            src="/icono-logo.png"
            width={132}
          />
        </Link>
        <nav className={`site-nav ${menuOpen ? "site-nav-open" : ""}`} id="mobile-navigation">
          <div
            className={`sports-nav ${sportsMenuOpen && isMobileNav ? "sports-nav-open" : ""}`}
            onMouseEnter={() => {
              if (!isMobileNav) setSportsMenuOpen(true);
            }}
            onMouseLeave={() => {
              if (!isMobileNav) setSportsMenuOpen(false);
            }}
          >
            <button
              aria-expanded={isMobileNav ? sportsMenuOpen : undefined}
              aria-haspopup="menu"
              className="nav-link sports-nav-trigger"
              onClick={() => {
                if (isMobileNav) setSportsMenuOpen((current) => !current);
              }}
              type="button"
            >
              Sports <span aria-hidden="true">⌄</span>
            </button>
            <div className="sports-dropdown" aria-label="Sports">
              <p>Sports</p>
              {sports.map((sport) => (
                <Link
                  className="sports-dropdown-link"
                  href={sport.href}
                  key={sport.href}
                  onClick={() => {
                    setMenuOpen(false);
                    setSportsMenuOpen(false);
                  }}
                  style={{ "--sport-accent": sport.accent } as CSSProperties}
                >
                  <span>{sport.shortName}</span>
                  <b>
                    {sport.name}
                    <small>{sport.description}</small>
                  </b>
                  <i aria-hidden="true">→</i>
                </Link>
              ))}
            </div>
          </div>
          {headerNavItems.map((item) => {
            const isActive =
              item.activePath !== null &&
              (pathname === item.activePath || pathname.startsWith(`${item.activePath}/`));

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                href={item.href}
                key={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              {foundingSupporter ? (
                <span className="supporter-badge">Founding Supporter</span>
              ) : null}
              <button className="header-auth" onClick={signOutUser} type="button">
                <span className="user-avatar" aria-hidden="true">
                  {userInitial}
                </span>
                Sign out
              </button>
            </>
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
