import type { Metadata } from "next";
import { F1LandingPage } from "@/components/F1LandingPage";
import { getLocalF1DataServer } from "@/lib/local-f1-data-server";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "GRDX1 Formula 1 | AI Race Predictions & Analytics",
  description:
    "Explore Formula 1 machine-learning race predictions, race analysis, driver performance and circuit data with GRDX1.",
  alternates: {
    canonical: absoluteUrl("/f1"),
  },
  openGraph: {
    description:
      "Explore Formula 1 machine-learning race predictions, race analysis, driver performance and circuit data with GRDX1.",
    title: "GRDX1 Formula 1 | AI Race Predictions & Analytics",
    type: "website",
    url: absoluteUrl("/f1"),
  },
};

export default async function FormulaOnePage() {
  const localData = await getLocalF1DataServer();

  return <F1LandingPage initialData={localData} />;
}
