"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getLocalF1Data } from "@/lib/f1-ranker-api";
import type { Race } from "@/lib/types";

const features = [
  ["UPCOMING EVENTS", "Discover future races."],
  ["AI PREDICTIONS", "Explore predicted race results."],
  ["RACE ANALYTICS", "Read driver and circuit signals."],
  ["HISTORICAL DATA", "Compare previous race outcomes."],
];

const steps = [
  ["01", "CHOOSE A RACE"],
  ["02", "ANALYZE THE DATA"],
  ["03", "GENERATE PREDICTION"],
  ["04", "EXPLORE RESULTS"],
];

const trackPaths = [
  "M19 53 C48 12, 93 7, 124 28 C156 50, 159 73, 121 74 C88 75, 79 52, 48 66 C32 73, 14 70, 19 53Z",
  "M18 61 C12 35, 39 16, 68 25 C94 33, 96 53, 119 55 C146 58, 162 25, 176 40 C187 52, 169 75, 142 72 C111 69, 93 84, 61 75 C39 69, 24 77, 18 61Z",
  "M25 25 C43 8, 77 18, 81 38 C85 59, 111 64, 133 52 C153 41, 172 50, 163 67 C153 86, 119 77, 94 72 C65 66, 28 75, 20 55 C16 44, 17 33, 25 25Z",
  "M20 46 C31 20, 59 14, 79 29 C98 43, 113 28, 135 22 C159 15, 175 33, 161 52 C145 73, 111 65, 91 59 C65 51, 48 81, 27 68 C18 62, 16 54, 20 46Z",
];

const countryCodes: Record<string, string> = {
  Australia: "AU",
  Azerbaijan: "AZ",
  Bahrain: "BH",
  Belgium: "BE",
  Brazil: "BR",
  Canada: "CA",
  China: "CN",
  France: "FR",
  Hungary: "HU",
  Italy: "IT",
  Japan: "JP",
  Mexico: "MX",
  Monaco: "MC",
  Netherlands: "NL",
  Qatar: "QA",
  Saudi: "SA",
  Singapore: "SG",
  Spain: "ES",
  Turkey: "TR",
  UAE: "AE",
  "United Kingdom": "UK",
  "United States": "US",
};

function formatLandingDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short" })
    .format(date)
    .toUpperCase();
}

function countryCode(country?: string) {
  return countryCodes[country ?? ""] ?? country?.slice(0, 2).toUpperCase() ?? "F1";
}

export function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [races, setRaces] = useState<Race[]>([]);
  const [racesLoading, setRacesLoading] = useState(true);

  useEffect(() => {
    getLocalF1Data()
      .then((data) => setRaces(data.races.filter((race) => race.status === "future").slice(0, 3)))
      .catch(() => setRaces([]))
      .finally(() => setRacesLoading(false));
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const progress = Math.min(window.scrollY / Math.max(window.innerHeight * 0.9, 1), 1);
        setScrollProgress(progress);
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div
      className="landing"
      style={
        {
          "--hero-progress": scrollProgress,
        } as React.CSSProperties
      }
    >
      <section className="hero-section">
        <Image
          alt="Generic motorsport car racing at sunset"
          className="hero-image"
          fill
          priority
          sizes="100vw"
          src="/mockup/hero-image.png"
        />
        <div className="hero-vignette" />
        <div className="hero-fade" />
        <div className="hero-grid" />

        <div className="hero-content">
          <p className="tech-label">ML RACE INTELLIGENCE</p>
          <h1>
            PREDICT.
            <br />
            ANALYZE.
            <br />
            <span>WIN.</span>
          </h1>
          <p className="hero-copy">AI-powered motorsport predictions.</p>
          <Link className="red-cta" href="/races">
            Explore Races <span>→</span>
          </Link>
        </div>

        <div className="hero-telemetry" aria-hidden="true">
          <span>SECTOR 03</span>
          <span>RACE PACE</span>
          <span>MODEL READY</span>
        </div>

        <div className="scroll-cue" aria-hidden="true">
          <span />
          <small>SCROLL</small>
        </div>
      </section>

      <section className="dark-entry" id="about">
        <p className="tech-label reveal">BUILT FOR RACING DATA</p>
        <h2 className="reveal">Predict what happens next.</h2>
      </section>

      <section className="landing-section upcoming-section">
        <div className="section-heading reveal">
            <p className="tech-label">UPCOMING RACES</p>
          <h2>Select the next event.</h2>
          <Link href="/races">View all races →</Link>
        </div>
        <div className="race-strip">
          {racesLoading
            ? Array.from({ length: 3 }, (_, index) => (
                <article className="event-tile event-tile-skeleton" aria-hidden="true" key={`race-skeleton-${index}`}>
                  <span className="skeleton-line skeleton-status" />
                  <span className="skeleton-line skeleton-title" />
                  <span className="skeleton-track" />
                  <span className="skeleton-line skeleton-date" />
                </article>
              ))
            : races.map((race, index) => (
                <Link className="event-tile reveal" href={`/races?race=${race.raceId}`} key={race.raceId}>
                  <div>
                    <span>{index === 0 ? "NEXT" : "OPEN"}</span>
                    <strong>{race.name.replace(/\s+Grand Prix$/u, "")}</strong>
                  </div>
                  <svg viewBox="0 0 180 86" role="img" aria-label={`${race.name} circuit outline`}>
                    <path d={trackPaths[index % trackPaths.length]} />
                  </svg>
                  <footer>
                    <b>{formatLandingDate(race.date)}</b>
                    <span>{countryCode(race.circuit?.country)}</span>
                  </footer>
                </Link>
              ))}
        </div>
      </section>

      <section className="landing-section prediction-experience">
        <div className="prediction-copy reveal">
          <p className="tech-label">RACE INTELLIGENCE</p>
          <h2>
            SEE THE FUTURE
            <br />
            BEFORE THE LIGHTS GO OUT.
          </h2>
          <p>Choose a race and prepare a data-backed prediction before the lights go out.</p>
          <Link className="red-cta" href="/races">
            Browse Races <span>→</span>
          </Link>
        </div>

        <div className="dashboard-mock reveal">
          <aside>
            <b>Predict Race</b>
            <span>Dashboard</span>
            <span>Races</span>
            <span>Race setup</span>
            <span>History</span>
          </aside>
          <main>
            <div className="mock-card mock-wide">
              <small>UPCOMING RACE</small>
              <h3>Monaco Grand Prix</h3>
              <p>Race date · Circuit confidence · Dry conditions</p>
              <svg viewBox="0 0 200 90">
                <path d="M22 55 C35 22, 77 21, 94 43 S130 65, 151 33 C160 18, 183 28, 171 48 C158 70, 121 78, 86 64 C59 53, 43 77, 22 55Z" />
              </svg>
            </div>
            <div className="mock-card prediction-list">
              <small>TOP PREDICTION</small>
              {["Driver A", "Driver B", "Driver C", "Driver D", "Driver E"].map((driver, index) => (
                <div key={driver}>
                  <span>{index + 1}. {driver}</span>
                  <i style={{ width: `${72 - index * 11}%` }} />
                  <b>{[31, 23, 18, 15, 13][index]}%</b>
                </div>
              ))}
            </div>
          </main>
          <section>
            <div className="probability-ring">31%</div>
            <div className="mock-card compact">
              <small>TRACK STATS</small>
              <p>Turns 19</p>
              <p>Length 3.337 km</p>
              <p>Lap pace 1:12</p>
            </div>
          </section>
        </div>
      </section>

      <section className="photo-break">
        <Image
          alt="Generic racing circuit at high speed"
          className="photo-break-image"
          fill
          sizes="100vw"
          src="/mockup/hero-image.png"
        />
        <div className="photo-break-fade" />
        <h2 className="reveal">
          DATA DOESN&apos;T GUESS.
          <br />
          IT <span>LEARNS.</span>
        </h2>
      </section>

      <section className="landing-section feature-line">
        {features.map(([title, copy]) => (
          <article className="feature-item reveal" key={title}>
            <span />
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="landing-section process-section" id="how-it-works">
        <p className="tech-label reveal">HOW IT WORKS</p>
        <div className="process-line">
          {steps.map(([number, title]) => (
            <article className="process-step reveal" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div className="cta-glow" />
        <h2 className="reveal">READY FOR THE NEXT RACE?</h2>
        <Link className="red-cta reveal" href="/races">
          Browse Races <span>→</span>
        </Link>
      </section>

      <footer className="landing-footer">
        <Link href="/" className="brand-mark">
          <span>Apex</span>
          <span>Predictor</span>
        </Link>
        <nav>
          <Link href="/races">Races</Link>
          <Link href="/#about">About</Link>
        </nav>
        <p>© 2026 Apex Predictor</p>
      </footer>
    </div>
  );
}
