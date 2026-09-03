import type { Metadata } from "next";
import Link from "next/link";
import { getFoundingPromotion, KOFI_SUPPORT_URL } from "@/lib/kofi-config";
import { absoluteUrl, siteName } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support GRDX1",
  description:
    "Support GRDX1, an independent motorsport analytics and machine learning project.",
  alternates: {
    canonical: absoluteUrl("/support"),
  },
  openGraph: {
    description:
      "Support GRDX1, an independent motorsport analytics and machine learning project.",
    title: `Support GRDX1 | ${siteName}`,
    type: "website",
    url: absoluteUrl("/support"),
  },
};

const supportAreas = [
  "Cloud infrastructure",
  "Model development",
  "Data processing",
  "New analytics features",
  "Continued development of GRDX1",
];

export default function SupportPage() {
  const promotion = getFoundingPromotion();

  return (
    <section className="page-shell support-page mx-auto max-w-7xl px-4 pb-12">
      <header className="support-hero panel">
        <div>
          <p className="tech-label">INDEPENDENT RACE INTELLIGENCE</p>
          <h1>Support GRDX1</h1>
          <p>
            GRDX1 is an independent motorsport analytics and machine learning project.
            Support helps keep the platform moving while we build stronger Formula 1
            prediction tools, clearer analysis, and a faster data workflow.
          </p>
          <a className="red-cta" href={KOFI_SUPPORT_URL} rel="noreferrer" target="_blank">
            Support GRDX1 on Ko-fi <span>↗</span>
          </a>
          <small>
            For automatic supporter access, use a Ko-fi email that matches your GRDX1 account email
            when possible.
          </small>
        </div>
        <div className="support-impact" aria-label="Support impact areas">
          {supportAreas.map((area) => (
            <span key={area}>{area}</span>
          ))}
        </div>
      </header>

      {promotion.active ? (
        <section className="founding-supporter-panel panel">
          <div>
            <p className="tech-label">LAUNCH PROMOTION</p>
            <h2>Become a Founding Supporter</h2>
            <p>
              Support GRDX1 during our launch period and receive unlimited access to all current
              Formula 1 prediction and analysis features.
            </p>
          </div>
          <a className="button-primary" href={KOFI_SUPPORT_URL} rel="noreferrer" target="_blank">
            Support GRDX1 on Ko-fi <span>↗</span>
          </a>
        </section>
      ) : (
        <section className="founding-supporter-panel panel">
          <div>
            <p className="tech-label">SUPPORTER ACCESS</p>
            <h2>Help build what comes next.</h2>
            <p>
              The Founding Supporter launch promotion is not currently active, but Ko-fi support
              still helps fund ongoing development of GRDX1.
            </p>
          </div>
          <Link className="button-secondary" href="/races">
            Explore current features <span>→</span>
          </Link>
        </section>
      )}
    </section>
  );
}
