import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CircuitSilhouette } from "@/components/CircuitSilhouette";
import { absoluteUrl, siteName } from "@/lib/site";

const monzaRaceId = 1181;
const pageTitle = "2026 Italian Grand Prix at Monza: F1 Schedule, Circuit Guide and Practice Update";
const pageDescription =
  "Complete 2026 Italian Grand Prix guide for Monza with the F1 schedule, circuit facts, Friday practice updates, strategy keys and a GRDX1 race prediction link.";
const monzaAerialImage =
  "https://upload.wikimedia.org/wikipedia/commons/6/65/Monza_aerial_photo.jpg";
const monzaTrackImage =
  "https://upload.wikimedia.org/wikipedia/commons/1/1b/Autodromo_di_Monza.JPG";

const monzaRace = {
  raceId: monzaRaceId,
  year: 2026,
  round: 13,
  circuitId: 14,
  name: "Italian Grand Prix",
  date: "2026-09-06",
  time: "13:00:00",
  status: "future" as const,
  circuit: {
    circuitId: 14,
    circuitRef: "monza",
    name: "Autodromo Nazionale di Monza",
    location: "Monza",
    country: "Italy",
  },
};

const schedule = [
  ["Friday, Sep 4", "Practice 1", "10:30 - 11:30", "Monza"],
  ["Friday, Sep 4", "Practice 2", "14:00 - 15:00", "Monza"],
  ["Saturday, Sep 5", "Practice 3", "10:30 - 11:30", "Monza"],
  ["Saturday, Sep 5", "Qualifying", "14:00 - 15:00", "Monza"],
  ["Sunday, Sep 6", "Race", "13:00", "Monza"],
];

const stats = [
  ["Circuit", "Autodromo Nazionale di Monza"],
  ["Length", "5.793 km"],
  ["Laps", "53"],
  ["Race distance", "306.72 km"],
  ["First Grand Prix", "1950"],
  ["Fastest lap", "1:20.901 - Lando Norris, 2025"],
];

const practiceSummary = [
  ["FP1 leader", "Charles Leclerc", "1:23.008"],
  ["FP1 top three", "Leclerc, Hamilton, Russell", "Ferrari 1-2"],
  ["FP2 leader", "George Russell", "1:22.559"],
  ["FP2 top five", "Russell, Leclerc, Antonelli, Norris, Hamilton", "0.457s split"],
];

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "2026 Italian Grand Prix",
    "Monza F1",
    "Italian Grand Prix schedule",
    "Formula 1 Monza practice results",
    "Italian GP race prediction",
    "Italian Grand Prix 2026",
  ],
  alternates: {
    canonical: absoluteUrl("/monza"),
  },
  openGraph: {
    description: pageDescription,
    images: [
      {
        alt: "Aerial view of Autodromo Nazionale di Monza",
        url: monzaAerialImage,
      },
    ],
    title: pageTitle,
    type: "article",
    url: absoluteUrl("/monza"),
  },
};

export default function MonzaPage() {
  const publishedAt = "2026-09-05T00:00:00-05:00";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        author: { "@type": "Organization", name: siteName },
        dateModified: publishedAt,
        datePublished: publishedAt,
        description: pageDescription,
        headline: pageTitle,
        image: [monzaAerialImage, monzaTrackImage],
        inLanguage: "en",
        mainEntityOfPage: absoluteUrl("/monza"),
        publisher: { "@type": "Organization", name: siteName },
      },
      {
        "@type": "SportsEvent",
        endDate: "2026-09-06T15:00:00+02:00",
        eventStatus: "https://schema.org/EventScheduled",
        image: monzaAerialImage,
        location: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressCountry: "IT",
            addressLocality: "Monza",
          },
          name: "Autodromo Nazionale di Monza",
        },
        name: "Formula 1 Pirelli Gran Premio d'Italia 2026",
        startDate: "2026-09-06T13:00:00+02:00",
        url: absoluteUrl("/monza"),
      },
    ],
  };

  return (
    <article className="monza-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="monza-hero">
        <Image
          alt="Aerial view of Autodromo Nazionale di Monza"
          className="monza-hero-image"
          fill
          priority
          sizes="100vw"
          src={monzaAerialImage}
        />
        <div className="monza-hero-overlay" />
        <div className="monza-hero-content">
          <p className="tech-label">FORMULA 1 · 2026 ITALIAN GRAND PRIX</p>
          <h1>Monza schedule, circuit guide and race prediction</h1>
          <p>
            Formula 1 is at the Autodromo Nazionale di Monza for round 13 of
            the 2026 season. Today, Saturday September 5, is practice three and
            qualifying day; the Italian Grand Prix race is Sunday September 6.
          </p>
          <div className="monza-hero-actions">
            <Link className="red-cta" href={`/races?race=${monzaRaceId}`}>
              Predict race results <span>→</span>
            </Link>
            <a href="#schedule">View schedule</a>
          </div>
        </div>
      </section>

      <section className="monza-section monza-intro">
        <div>
          <p className="tech-label">RACE WEEKEND GUIDE</p>
          <h2>What is happening at Monza today</h2>
        </div>
        <p>
          If you are looking for the race today, the exact date matters:
          Saturday September 5, 2026 is FP3 and qualifying at Monza. The 2026
          Italian Grand Prix race starts on Sunday September 6 at 13:00 local
          track time. In Colombia, that is 06:00 on Sunday morning.
        </p>
      </section>

      <section className="monza-section monza-grid" id="schedule">
        <div className="monza-main">
          <h2>2026 Italian Grand Prix schedule</h2>
          <div className="monza-schedule">
            {schedule.map(([day, session, time, zone]) => (
              <div key={`${day}-${session}`}>
                <span>{day}</span>
                <strong>{session}</strong>
                <b>{time}</b>
                <small>{zone} local time</small>
              </div>
            ))}
          </div>
        </div>

        <aside className="monza-side-panel">
          <CircuitSilhouette className="monza-circuit" race={monzaRace} />
          <h2>Autodromo Nazionale di Monza</h2>
          <p>
            Monza rewards low drag, straight-line speed, braking stability and
            clean traction out of its chicanes.
          </p>
        </aside>
      </section>

      <section className="monza-section">
        <div className="monza-practice-panel">
          <div>
            <p className="tech-label">FRIDAY PRACTICE UPDATE</p>
            <h2>Ferrari started fast, Mercedes answered in FP2</h2>
            <p>
              Charles Leclerc led a Ferrari one-two in FP1 with a 1:23.008,
              ahead of Lewis Hamilton and George Russell. In FP2, Russell moved
              to the top with a 1:22.559, followed by Leclerc, Kimi Antonelli,
              Lando Norris and Hamilton.
            </p>
          </div>
          <div className="monza-practice-grid">
            {practiceSummary.map(([label, value, note]) => (
              <div key={label}>
                <span>{label}</span>
                <b>{value}</b>
                <small>{note}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="monza-photo-row">
        <figure>
          <Image
            alt="Main straight and grandstand at Monza"
            height={295}
            sizes="(max-width: 760px) 100vw, 42vw"
            src={monzaTrackImage}
            width={444}
          />
          <figcaption>
            Public image: Wikimedia Commons, Autodromo di Monza.
          </figcaption>
        </figure>
        <div>
          <p className="tech-label">TEMPLE OF SPEED</p>
          <h2>Why Monza changes the prediction model</h2>
          <p>
            Monza does not reward the same package as high-downforce circuits.
            Lap time depends heavily on straight-line efficiency, confidence
            under braking into Rettifilo and Roggia, and tyre management without
            losing traction on corner exit.
          </p>
          <p>
            For the GRDX1 predictor, that makes the event sensitive to starting
            position, recent driver form, constructor performance and previous
            consistency at low-downforce venues.
          </p>
        </div>
      </section>

      <section className="monza-section">
        <div className="monza-stat-grid">
          {stats.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="monza-section monza-content-grid">
        <div>
          <h2>Qualifying and race keys</h2>
          <ul>
            <li>
              <strong>Tow and track position:</strong> in qualifying, a clean
              slipstream can be worth tenths, but traffic can ruin the lap.
            </li>
            <li>
              <strong>Heavy braking:</strong> Rettifilo and Roggia create the
              biggest passing chances and the highest lock-up risk.
            </li>
            <li>
              <strong>Top speed:</strong> the main straight and the run to
              Ascari reward efficient cars with strong DRS performance.
            </li>
            <li>
              <strong>Strategy:</strong> pit loss, tyre degradation, track
              temperature and traffic will shape the one-stop versus two-stop
              decision.
            </li>
          </ul>
        </div>
        <div className="monza-cta-panel">
          <p className="tech-label">GRDX1 PREDICTOR</p>
          <h2>Run your prediction before the race</h2>
          <p>
            Open the app, select the Italian Grand Prix and generate an
            estimated race ranking from the latest data available in GRDX1.
          </p>
          <Link className="red-cta" href={`/races?race=${monzaRaceId}`}>
            Predict Monza <span>→</span>
          </Link>
        </div>
      </section>

      <section className="monza-sources">
        <h2>Sources</h2>
        <a href="https://www.formula1.com/en/racing/2026/italy" rel="noreferrer" target="_blank">
          Formula 1: Italian Grand Prix 2026
        </a>
        <a href="https://www.formula1.com/en/latest/article/need-to-know-the-most-important-facts-stats-and-trivia-ahead-of-the-2026-italian-grand-prix.3R2slU8oSHdeOc5lidJDGy" rel="noreferrer" target="_blank">
          Formula 1: Need to Know Italian Grand Prix
        </a>
        <a href="https://commons.wikimedia.org/wiki/File:Monza_aerial_photo.jpg" rel="noreferrer" target="_blank">
          Wikimedia Commons: Monza aerial photo
        </a>
      </section>
    </article>
  );
}
