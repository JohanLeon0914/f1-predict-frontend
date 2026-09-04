import Image from "next/image";
import Link from "next/link";
import type { FighterPortrait } from "@/lib/thesportsdb";
import type { UfcDisplayEvent } from "@/lib/ufc-data";

type UfcEventsPageProps = {
  events: UfcDisplayEvent[];
  portraits: FighterPortrait[];
};

function formatEventDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  return {
    day: new Intl.DateTimeFormat("en-US", { day: "2-digit" }).format(date),
    label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date).toUpperCase(),
    year: new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(date),
  };
}

function getPortrait(portraits: FighterPortrait[], name?: string) {
  return portraits.find((portrait) => portrait.originalName.toLowerCase() === name?.toLowerCase());
}

export function EventRow({ event, portraits }: { event: UfcDisplayEvent; portraits: FighterPortrait[] }) {
  const date = formatEventDate(event.date);
  const mainFight = event.fights[0];
  const redPortrait = getPortrait(portraits, mainFight?.red.name);
  const bluePortrait = getPortrait(portraits, mainFight?.blue.name);

  return (
    <Link className="ufc-event-row reveal" href={`/events/${event.eventId}`}>
      <div className="ufc-event-date">
        <span>{date.label}</span>
        <strong>{date.day}</strong>
        <small>{date.year}</small>
      </div>
      <div className="ufc-event-face red-face">
        {redPortrait?.imageUrl ? (
          <Image alt="" height={130} src={redPortrait.imageUrl} unoptimized width={130} />
        ) : (
          <Image alt="" height={130} src="/UFC/silueta.png" width={130} />
        )}
      </div>
      <div className="ufc-event-row-copy">
        <small>{event.shortName}</small>
        <h2>
          {mainFight ? (
            <>
              {mainFight.red.name.split(" ").at(-1)} <span>vs</span>{" "}
              {mainFight.blue.name.split(" ").at(-1)}
            </>
          ) : (
            event.name
          )}
        </h2>
        <p>
          {event.venue} · {event.location}
        </p>
      </div>
      <div className="ufc-event-face blue-face">
        {bluePortrait?.imageUrl ? (
          <Image alt="" height={130} src={bluePortrait.imageUrl} unoptimized width={130} />
        ) : (
          <Image alt="" height={130} src="/UFC/silueta.png" width={130} />
        )}
      </div>
      <span className="ufc-event-status">Upcoming</span>
      <i aria-hidden="true">›</i>
    </Link>
  );
}

export function UfcEventsPage({ events, portraits }: UfcEventsPageProps) {
  return (
    <div className="ufc-events-official">
      <section className="ufc-events-list-hero">
        <Image
          alt=""
          aria-hidden="true"
          className="ufc-events-list-hero-image"
          fill
          priority
          sizes="100vw"
          src="/UFC/jaula_esquina_inferior_derecha.png"
        />
        <div className="ufc-events-list-overlay" />
        <div className="ufc-events-list-content reveal">
          <p className="tech-label ufc-label">UFC</p>
          <h1>
            Upcoming
            <br />
            Events
          </h1>
          <p>Select an event to view the fight card and run your predictions. Powered by data.</p>
        </div>
        <div className="ufc-more-than-fight" aria-hidden="true">
          <span>MORE</span>
          <span>THAN</span>
          <span>A FIGHT</span>
        </div>
      </section>

      <section className="ufc-events-list-shell">
        <div className="ufc-event-list">
          {events.map((event) => (
            <EventRow event={event} key={event.eventId} portraits={portraits} />
          ))}
        </div>
      </section>
    </div>
  );
}
