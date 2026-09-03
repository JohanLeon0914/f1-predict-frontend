import Link from "next/link";
import { contactEmail, socialLinks } from "@/lib/site";

const footerLinks = [
  { href: "/analysis", label: "Analysis" },
  { href: "/races", label: "Races" },
  { href: "/support", label: "Support" },
  { href: "/#who-we-are", label: "About & Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Link href="/" className="brand-mark site-footer-brand">
          <span>GRDX1</span>
          <span>Motorsports intelligence</span>
        </Link>

        <nav className="site-footer-links" aria-label="Footer links">
          {footerLinks.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-footer-contact">
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          <div className="site-footer-socials" aria-label="Social links">
            {socialLinks.map((item) => (
              <a href={item.href} key={item.label} rel="noreferrer" target="_blank">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
