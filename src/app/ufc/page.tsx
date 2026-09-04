import type { Metadata } from "next";
import { UfcLandingPage } from "@/components/UfcLandingPage";
import { absoluteUrl } from "@/lib/site";
import { getUfcFighters } from "@/lib/ufc-data";

export const metadata: Metadata = {
  title: "GRDX1 UFC | AI Fight Predictions & Analytics",
  description:
    "Explore UFC machine-learning fight predictions, matchup analysis, fighter performance and model output with GRDX1.",
  alternates: {
    canonical: absoluteUrl("/ufc"),
  },
  openGraph: {
    description:
      "Explore UFC machine-learning fight predictions, matchup analysis, fighter performance and model output with GRDX1.",
    title: "GRDX1 UFC | AI Fight Predictions & Analytics",
    type: "website",
    url: absoluteUrl("/ufc"),
  },
};

export default async function UfcPage() {
  const fighters = await getUfcFighters();

  return <UfcLandingPage fighters={fighters} />;
}
