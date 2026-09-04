import type { Metadata } from "next";
import { UfcLandingPage } from "@/components/UfcLandingPage";
import { absoluteUrl } from "@/lib/site";
import { getFeaturedFighterPortraits } from "@/lib/thesportsdb";
import { getUfcLandingData } from "@/lib/ufc-data";

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
  const { events, fighters } = await getUfcLandingData();
  const fighterNames = events.slice(0, 3).flatMap((event) =>
    event.fights.flatMap((fight) => [fight.red.name, fight.blue.name]),
  );
  const portraits = await getFeaturedFighterPortraits([...new Set(fighterNames)]);

  return <UfcLandingPage events={events} fighters={fighters} portraits={portraits} />;
}
