import type { Metadata } from "next";
import Image from "next/image";
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
  {
    copy: "Keep GRDX1 servers, pipelines, and prediction services reliable as usage grows.",
    icon: "01",
    title: "Cloud Infrastructure",
  },
  {
    copy: "Train, test, and improve machine learning models for sharper Formula 1 analysis.",
    icon: "02",
    title: "Model Development",
  },
  {
    copy: "Process race calendars, driver data, qualifying context, and model signals faster.",
    icon: "03",
    title: "Data Processing",
  },
  {
    copy: "Build new dashboards, richer explanations, and better tools for the F1 community.",
    icon: "04",
    title: "New Analytics Features",
  },
];

function formatPromoDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short" })
    .format(new Date(value))
    .toUpperCase();
}

export default function SupportPage() {
  const promotion = getFoundingPromotion();
  const promoStart = formatPromoDate(promotion.start);
  const promoEnd = formatPromoDate(promotion.end);

  return (
    <section className="support-page">
      <header className="support-hero">
        <Image
          alt="Formula racing car under stadium lights"
          className="support-hero-image"
          fill
          priority
          sizes="100vw"
          src="/mockup/hero-image.png"
        />
        <div className="support-hero-shade" />
        <div className="support-hero-content">
          <p className="tech-label">SUPPORT GRDX1</p>
          <h1>
            Help us build
            <span> the next lap.</span>
          </h1>
          <p>
            GRDX1 is an independent motorsport analytics project powered by machine learning and
            real data. Your support helps keep the models running, improve predictions, and build
            new analytics for the Formula 1 community.
          </p>
          <a className="red-cta support-hero-cta" href={KOFI_SUPPORT_URL} rel="noreferrer" target="_blank">
            Support GRDX1 on Ko-fi <span>↗</span>
          </a>
          <div className="support-trust-list" aria-label="GRDX1 principles">
            <span>Independent Project</span>
            <span>Real Data</span>
            <span>Privacy Focused</span>
          </div>
        </div>
      </header>

      {promotion.active ? (
        <section className="founding-supporter-panel">
          <div className="founding-date-block">
            <span className="founding-icon">✓</span>
            <div>
              <p className="tech-label">FOUNDING SUPPORTER</p>
              <strong>Limited to our first month</strong>
            </div>
            {promoStart && promoEnd ? <b>{promoStart} - {promoEnd}</b> : null}
          </div>
          <div className="founding-copy">
            <h2>Become a <span>Founding Supporter</span></h2>
            <p>
              Support GRDX1 during our launch period and receive unlimited access to all current
              Formula 1 prediction and analysis features.
            </p>
            <div className="founding-perks" aria-label="Founding supporter benefits">
              <span>Unlimited Predictions</span>
              <span>Current F1 Analysis</span>
              <span>Founding Supporter Badge</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="founding-supporter-panel founding-supporter-panel-ended">
          <div className="founding-copy">
            <p className="tech-label">SUPPORTER ACCESS</p>
            <h2>Help build <span>what comes next.</span></h2>
            <p>
              The Founding Supporter launch promotion is not currently active, but Ko-fi support
              still helps fund ongoing development of GRDX1.
            </p>
          </div>
        </section>
      )}

      <section className="support-section">
        <div className="support-section-heading">
          <p className="tech-label">WHERE YOUR SUPPORT GOES</p>
          <h2>Fueling the project</h2>
        </div>
        <div className="support-impact-grid">
          {supportAreas.map((area) => (
            <article className="support-impact-card" key={area.title}>
              <span>{area.icon}</span>
              <h3>{area.title}</h3>
              <p>{area.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="support-final-cta">
        <div>
          <h2>
            Join the
            <span> founding grid.</span>
          </h2>
          <p>
            Every contribution helps GRDX1 keep improving its data pipeline, prediction workflow,
            and public Formula 1 analysis experience.
          </p>
        </div>
        <div className="support-final-action">
          <a className="red-cta" href={KOFI_SUPPORT_URL} rel="noreferrer" target="_blank">
            Support GRDX1 on Ko-fi <span>↗</span>
          </a>
          <small>Ko-fi opens in a new tab.</small>
          <p>
            Use the same email associated with your GRDX1 account when supporting us on Ko-fi.
          </p>
        </div>
      </section>

      <div className="support-secondary-link">
        <Link href="/races">Explore current GRDX1 features <span>→</span></Link>
      </div>
    </section>
  );
}
