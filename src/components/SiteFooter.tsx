import Image from "next/image";
import Link from "next/link";
import { contactEmail, socialLinks } from "@/lib/site";

const navigationLinks = [
  { href: "/races", label: "Races" },
  { href: "/analysis", label: "Analysis" },
  { href: "/#who-we-are", label: "About & Contact" },
  { href: "/support", label: "Support" },
];

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <div className="site-footer-brand-block">
          <Link href="/" className="site-footer-logo" aria-label="GRDX1 home">
            <Image alt="GRDX1" height={44} src="/icono-logo.png" width={132} />
          </Link>
          <p>
            Race intelligence.
            <span>Before the lights go out.</span>
          </p>
          <div className="site-footer-socials" aria-label="Social links">
            {socialLinks.map((item) => (
              <a href={item.href} key={item.label} rel="noreferrer" target="_blank">
                {item.label}
              </a>
            ))}
            <a href={`mailto:${contactEmail}`}>Email</a>
          </div>
        </div>

        <nav className="site-footer-column" aria-label="Navigation links">
          <h2>Navigation</h2>
          {navigationLinks.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="site-footer-column" aria-label="Legal links">
          <h2>Legal</h2>
          {legalLinks.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-footer-column site-footer-contact">
          <h2>Contact</h2>
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </div>
      </div>

      <div className="site-footer-bottom">
        <p>© 2026 GRDX1. All rights reserved.</p>
        <div>
          <span>Independent Project</span>
          <span>No Betting</span>
          <span>No Gambling</span>
        </div>
      </div>
    </footer>
  );
}
