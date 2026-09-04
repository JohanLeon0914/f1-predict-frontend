import type { Metadata } from "next";
import { UfcEventsPage } from "@/components/UfcEventsPage";
import { absoluteUrl } from "@/lib/site";
import { getFeaturedFighterPortraits } from "@/lib/thesportsdb";
import { getUfcDisplayEvents } from "@/lib/ufc-data";

export const metadata: Metadata = {
  title: "UFC Events | GRDX1",
  description:
    "Explore UFC events and TheSportsDB fighter image coverage for future GRDX1 fight prediction interfaces.",
  alternates: {
    canonical: absoluteUrl("/events"),
  },
  openGraph: {
    description:
      "Explore UFC events and TheSportsDB fighter image coverage for future GRDX1 fight prediction interfaces.",
    title: "UFC Events | GRDX1",
    type: "website",
    url: absoluteUrl("/events"),
  },
};

export default async function EventsPage() {
  const events = await getUfcDisplayEvents();
  const fighterNames = events.flatMap((event) =>
    event.fights.flatMap((fight) => [fight.red.name, fight.blue.name]),
  );
  const portraits = await getFeaturedFighterPortraits([...new Set(fighterNames)]);

  return <UfcEventsPage events={events} portraits={portraits} />;
}
