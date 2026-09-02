import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { absoluteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Disclaimer for GRDX1 explaining that predictions are statistical estimates and not betting or financial advice.",
  alternates: {
    canonical: absoluteUrl("/disclaimer"),
  },
  openGraph: {
    description:
      "Disclaimer for GRDX1 explaining that predictions are statistical estimates and not betting or financial advice.",
    title: `Disclaimer | ${siteName}`,
    type: "article",
    url: absoluteUrl("/disclaimer"),
  },
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      intro="GRDX1 is built to explain race data, not to promise outcomes."
      title="Disclaimer"
    >
      <section className="legal-section panel">
        <h2>Model-based analysis</h2>
        <p>
          GRDX1 provides statistical and machine-learning-based motorsport analysis. Predictions are
          estimates generated from model signals and should not be treated as guaranteed results.
        </p>
      </section>

      <section className="legal-section panel">
        <h2>Informational use only</h2>
        <p>
          The site is intended for informational and entertainment purposes. GRDX1 does not provide
          betting advice, financial advice, or professional racing advice.
        </p>
      </section>

      <section className="legal-section panel">
        <h2>Independence</h2>
        <p>
          GRDX1 is an independent project and is not affiliated with Formula 1, the FIA, Formula One
          Management, or any Formula 1 team.
        </p>
      </section>
    </LegalPage>
  );
}
