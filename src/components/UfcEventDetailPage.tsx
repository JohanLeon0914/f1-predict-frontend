import Image from "next/image";
import Link from "next/link";
import { UfcFightPredictor } from "@/components/UfcFightPredictor";
import { EventRow } from "@/components/UfcEventsPage";
import type { FighterPortrait } from "@/lib/thesportsdb";
import type { UfcDisplayEvent, UfcFight, UfcFighter } from "@/lib/ufc-data";

type UfcEventDetailPageProps = {
  event: UfcDisplayEvent;
  events: UfcDisplayEvent[];
  portraits: FighterPortrait[];
};

function getPortrait(portraits: FighterPortrait[], fighter: UfcFighter) {
  return portraits.find((portrait) => portrait.originalName.toLowerCase() === fighter.name.toLowerCase());
}

function fighterLastName(name: string) {
  return name.split(" ").at(-1) ?? name;
}

function formatDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .toUpperCase();
}

function calculateAge(dob: string | null) {
  if (!dob) return "--";
  const birthDate = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return "--";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthOffset = today.getMonth() - birthDate.getMonth();
  if (monthOffset < 0 || (monthOffset === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return String(age);
}

function FighterImage({ fighter, portrait, side }: { fighter: UfcFighter; portrait?: FighterPortrait; side: "blue" | "red" }) {
  return (
    <div className={`ufc-detail-fighter-image ${side}`}>
      {portrait?.imageUrl ? (
        <Image alt={`${fighter.name} portrait`} height={420} src={portrait.imageUrl} unoptimized width={330} />
      ) : (
        <Image alt="" height={420} src="/UFC/silueta.png" width={330} />
      )}
    </div>
  );
}

function CountryLine({ country }: { country: string }) {
  return (
    <small className="ufc-fighter-country">
      <span>{country || "International"}</span>
    </small>
  );
}

function MainEvent({
  event,
  fight,
  portraits,
}: {
  event: UfcDisplayEvent;
  fight: UfcFight;
  portraits: FighterPortrait[];
}) {
  const redStats = [
    { label: "Age", red: calculateAge(fight.red.dob), blue: calculateAge(fight.blue.dob) },
    { label: "Height", red: fight.red.height || "--", blue: fight.blue.height || "--" },
    { label: "Reach", red: fight.red.reach ? `${fight.red.reach}"` : "--", blue: fight.blue.reach ? `${fight.blue.reach}"` : "--" },
    { label: "Stance", red: fight.red.stance || "--", blue: fight.blue.stance || "--" },
  ];

  return (
    <section className="ufc-main-event-card reveal">
      <div className="ufc-main-event-title">
        <p>
          MAIN EVENT · {fight.weightClass} · {fight.titleFight ? "5 ROUNDS" : "3 ROUNDS"}
        </p>
        <span>Upcoming</span>
      </div>
      <div className="ufc-fight-overview">
        <div className="ufc-main-fighter">
          <h2>{fight.red.name}</h2>
          <CountryLine country={event.country} />
          <b>{fight.redRecord}</b>
        </div>
        <div className="ufc-main-fighter right">
          <h2>{fight.blue.name}</h2>
          <CountryLine country={fight.blue.name === "Salahdine Parnasse" ? "France" : event.country} />
          <b>{fight.blueRecord}</b>
        </div>
        <div className="ufc-stat-compare" aria-label="Fighter comparison">
          {redStats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.red}</strong>
              <span>{stat.label}</span>
              <strong>{stat.blue}</strong>
            </div>
          ))}
        </div>
        <UfcFightPredictor event={event} fight={fight} portraits={portraits} />
      </div>
    </section>
  );
}

function OtherEvents({
  currentEventId,
  events,
  portraits,
}: {
  currentEventId: string;
  events: UfcDisplayEvent[];
  portraits: FighterPortrait[];
}) {
  const otherEvents = events.filter((eventItem) => eventItem.eventId !== currentEventId).slice(0, 4);

  if (!otherEvents.length) return null;

  return (
    <section className="ufc-other-events reveal">
      <div className="ufc-section-title">
        <h2>OTHER EVENTS</h2>
        <Link href="/events">View all events <span>→</span></Link>
      </div>
      <div className="ufc-events-list-shell">
        <div className="ufc-event-list">
          {otherEvents.map((eventItem) => (
            <EventRow event={eventItem} key={eventItem.eventId} portraits={portraits} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function UfcEventDetailPage({ event, events, portraits }: UfcEventDetailPageProps) {
  const mainFight = event.fights[0];

  return (
    <div className="ufc-event-detail-page">
      <section className="ufc-event-detail-hero">
        <Image
          alt=""
          aria-hidden="true"
          className="ufc-event-detail-bg"
          fill
          priority
          sizes="100vw"
          src="/UFC/ufc_hero.png"
        />
        <div className="ufc-event-detail-overlay" />
        {mainFight ? (
          <>
            <FighterImage fighter={mainFight.red} portrait={getPortrait(portraits, mainFight.red)} side="red" />
            <FighterImage fighter={mainFight.blue} portrait={getPortrait(portraits, mainFight.blue)} side="blue" />
          </>
        ) : null}
        <div className="ufc-event-hero-copy reveal">
          <p>{event.shortName}</p>
          <h1>
            {mainFight ? (
              <>
                {fighterLastName(mainFight.red.name)}
                <span>vs</span>
                {fighterLastName(mainFight.blue.name)}
              </>
            ) : (
              event.name
            )}
          </h1>
          <small>
            {formatDate(event.date)} · {event.venue} · {event.location}
          </small>
          <b>Upcoming</b>
        </div>
      </section>

      <main className="ufc-event-detail-shell">
        {mainFight ? <MainEvent event={event} fight={mainFight} portraits={portraits} /> : null}

        <OtherEvents currentEventId={event.eventId} events={events} portraits={portraits} />
      </main>
    </div>
  );
}
