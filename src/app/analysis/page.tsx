import type { Metadata } from "next";
import { AnalysisCard } from "@/components/AnalysisPage";
import { getCachedLocalF1Data } from "@/lib/local-f1-data-server";
import { getAnalysisEntries } from "@/lib/analysis-content";
import { absoluteUrl, siteName } from "@/lib/site";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Analysis",
  description:
    "Public GRDX1 Formula 1 analysis pages, race previews, and model explanations built from the machine-learning prediction system.",
  alternates: {
    canonical: absoluteUrl("/analysis"),
  },
  openGraph: {
    description:
      "Public GRDX1 Formula 1 analysis pages, race previews, and model explanations built from the machine-learning prediction system.",
    title: `Analysis | ${siteName}`,
    type: "website",
    url: absoluteUrl("/analysis"),
  },
};

export default async function AnalysisIndexPage() {
  const localData = await getCachedLocalF1Data();
  const analysisEntries = getAnalysisEntries();

  return (
    <section className="page-shell analysis-page mx-auto max-w-7xl px-4 pb-12">
      <header className="analysis-index-hero panel">
        <div>
          <p className="tech-label">PUBLIC ANALYSIS</p>
          <h1>Formula 1 race analysis, built around the model.</h1>
          <p>
            GRDX1 publishes race previews and post-race analysis pages that can grow with the
            prediction system. Each page is structured for the model output, the reasoning behind
            it, and a later comparison against the real result.
          </p>
        </div>
        <div className="analysis-index-hero-panel" aria-hidden="true">
          <span>Prediction workflow</span>
          <b>Pre-race analysis</b>
          <b>Model ranking</b>
          <b>Post-race review</b>
        </div>
      </header>

      <section className="analysis-section">
        <div className="section-heading analysis-section-heading">
          <div>
            <p className="tech-label">AVAILABLE ANALYSES</p>
            <h2>Current race pages.</h2>
          </div>
        </div>
        <div className="analysis-grid">
          {analysisEntries.map((analysis) => (
            <AnalysisCard analysis={analysis} initialData={localData} key={analysis.slug} />
          ))}
        </div>
      </section>
    </section>
  );
}
