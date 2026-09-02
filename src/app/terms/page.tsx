import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { absoluteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms of use for GRDX1, a Formula 1 analytics and machine-learning prediction platform.",
  alternates: {
    canonical: absoluteUrl("/terms"),
  },
  openGraph: {
    description:
      "Terms of use for GRDX1, a Formula 1 analytics and machine-learning prediction platform.",
    title: `Terms | ${siteName}`,
    type: "article",
    url: absoluteUrl("/terms"),
  },
};

export default function TermsPage() {
  return (
    <LegalPage
      intro="These terms set the basic rules for using GRDX1 and its public prediction and analysis pages."
      title="Terms of Use"
    >
      <section className="legal-section panel">
        <h2>Using GRDX1</h2>
        <p>
          GRDX1 is provided for informational and entertainment use. You agree not to misuse the
          site, attempt unauthorized access, or interfere with the prediction workflow, saved data,
          or ad delivery.
        </p>
      </section>

      <section className="legal-section panel">
        <h2>Content</h2>
        <p>
          The site publishes motorsport analysis, race previews, and machine-learning-based
          prediction material. We may update, replace, or remove public content when the underlying
          race data or model output changes.
        </p>
      </section>

      <section className="legal-section panel">
        <h2>Accounts and saved data</h2>
        <p>
          Some features may require a signed-in account. Saved predictions, premium access, and
          quota checks may depend on Supabase-backed services and browser storage.
        </p>
      </section>

      <section className="legal-section panel">
        <h2>No warranties</h2>
        <p>
          GRDX1 is offered as-is. We do not guarantee uninterrupted access, perfect accuracy, or
          that every prediction will match the final race result.
        </p>
      </section>
    </LegalPage>
  );
}
