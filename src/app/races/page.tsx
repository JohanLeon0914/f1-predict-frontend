import type { Metadata } from "next";
import { Suspense } from "react";
import { RacesClient } from "@/components/RacesClient";
import { absoluteUrl, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "Races",
  description:
    "Use GRDX1 to pick a race, review drivers, and run Formula 1 machine-learning predictions.",
  alternates: {
    canonical: absoluteUrl("/races"),
  },
  openGraph: {
    description:
      "Use GRDX1 to pick a race, review drivers, and run Formula 1 machine-learning predictions.",
    title: `Races | ${siteName}`,
    type: "website",
    url: absoluteUrl("/races"),
  },
};

export default function RacesPage() {
  return (
    <Suspense fallback={<div className="page-shell races-loading" aria-busy="true" />}>
      <RacesClient />
    </Suspense>
  );
}
