import Image from "next/image";
import Link from "next/link";
import { contactEmail, socialLinks } from "@/lib/site";
import { sports } from "@/lib/sports";

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
          <p>GRDX1 - Machine learning for competitive sports.</p>
          <div className="site-footer-socials" aria-label="Social links">
            {socialLinks.map((item) => (
              <a href={item.href} key={item.label} rel="noreferrer" target="_blank">
                {item.label}
              </a>
            ))}
            <a href={`mailto:${contactEmail}`}>Email</a>
          </div>
        </div>

        <nav className="site-footer-column" aria-label="Sports links">
          <h2>Sports</h2>
          {sports.map((sport) => (
            <Link href={sport.href} key={sport.href}>
              {sport.name}
            </Link>
          ))}
        </nav>

        <nav className="site-footer-column" aria-label="Platform links">
          <h2>Platform</h2>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#who-we-are">About</Link>
        </nav>

        <nav className="site-footer-column" aria-label="Support links">
          <h2>Support</h2>
          <Link href="/support">Support GRDX1</Link>
        </nav>

        <nav className="site-footer-column" aria-label="Legal links">
          <h2>Legal</h2>
          {legalLinks.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="site-footer-bottom">
        <p>© 2026 GRDX1. All rights reserved.</p>
        <div>
          <span>Independent Project</span>
          <span>Model Output</span>
          <span>Data Analysis</span>
        </div>
      </div>
    </footer>
  );
}
