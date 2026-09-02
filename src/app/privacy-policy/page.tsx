import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { absoluteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for GRDX1 covering authentication, AdSense, local storage, analytics helpers, and third-party motorsport data sources.",
  alternates: {
    canonical: absoluteUrl("/privacy-policy"),
  },
  openGraph: {
    description:
      "Privacy policy for GRDX1 covering authentication, AdSense, local storage, analytics helpers, and third-party motorsport data sources.",
    title: `Privacy Policy | ${siteName}`,
    type: "article",
    url: absoluteUrl("/privacy-policy"),
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      intro="This policy explains the kinds of information GRDX1 may process through the live app, auth flow, ads, and data services it uses."
      title="Privacy Policy"
    >
      <section className="legal-section panel">
        <h2>What GRDX1 uses</h2>
        <p>
          GRDX1 uses Supabase authentication for sign-in, Google AdSense for advertising, local
          storage and session storage for guest IDs and saved predictions, and API requests to
          motorsport data services such as OpenF1, Jolpica, and the F1 CSV dataset bundled with the
          app.
        </p>
      </section>

      <section className="legal-section panel">
        <h2>Information that may be processed</h2>
        <ul>
          <li>Account information returned by your sign-in provider and Supabase.</li>
          <li>Guest and prediction identifiers stored in your browser.</li>
          <li>Saved prediction history that may live locally or in Supabase, depending on account state.</li>
          <li>Ad-related identifiers and cookies handled by Google AdSense.</li>
          <li>Requests made to third-party motorsport data services to load race and circuit information.</li>
        </ul>
      </section>

      <section className="legal-section panel">
        <h2>How the data is used</h2>
        <p>
          We use this data to authenticate users, show race predictions, keep saved simulations
          available, load public race data, and display ads where they are enabled. GRDX1 does not
          attempt to build a broad consumer profile outside the app experience described here.
        </p>
      </section>

      <section className="legal-section panel">
        <h2>Third parties</h2>
        <p>
          GRDX1 relies on third-party services for authentication, advertising, and motorsport data.
          Their own policies govern how they handle information they receive through their systems.
        </p>
      </section>

      <section className="legal-section panel">
        <h2>Updates</h2>
        <p>
          This policy can change as the app grows or new services are added. The footer links always
          point to the current public policy pages.
        </p>
      </section>
    </LegalPage>
  );
}
