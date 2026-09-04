import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UfcEventDetailPage } from "@/components/UfcEventDetailPage";
import { absoluteUrl } from "@/lib/site";
import { getFeaturedFighterPortraits } from "@/lib/thesportsdb";
import { getUfcDisplayEvent, getUfcDisplayEvents } from "@/lib/ufc-data";

type EventDetailProps = {
  params: Promise<{ id_event: string }>;
};

export async function generateMetadata({ params }: EventDetailProps): Promise<Metadata> {
  const { id_event } = await params;
  const event = await getUfcDisplayEvent(id_event);

  if (!event) {
    return {
      title: "UFC Event | GRDX1",
    };
  }

  return {
    title: `${event.name} | GRDX1`,
    description: `View the ${event.name} fight card and run GRDX1 UFC model analysis.`,
    alternates: {
      canonical: absoluteUrl(`/events/${event.eventId}`),
    },
    openGraph: {
      description: `View the ${event.name} fight card and run GRDX1 UFC model analysis.`,
      title: `${event.name} | GRDX1`,
      type: "website",
      url: absoluteUrl(`/events/${event.eventId}`),
    },
  };
}

export async function generateStaticParams() {
  const events = await getUfcDisplayEvents();
  return events.map((event) => ({ id_event: event.eventId }));
}

export default async function EventDetailPage({ params }: EventDetailProps) {
  const { id_event } = await params;
  const events = await getUfcDisplayEvents();
  const event = events.find((eventItem) => eventItem.eventId === id_event) ?? null;

  if (!event) notFound();

  const fighterNames = events.flatMap((eventItem) => eventItem.fights.flatMap((fight) => [fight.red.name, fight.blue.name]));
  const portraits = await getFeaturedFighterPortraits([...new Set(fighterNames)]);

  return <UfcEventDetailPage event={event} events={events} portraits={portraits} />;
}
