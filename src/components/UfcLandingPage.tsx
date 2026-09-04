"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthRequiredModal } from "@/components/AuthRequiredModal";
import { useAuth } from "@/components/AuthProvider";
import { checkUfcPredictionQuota, saveUfcPrediction } from "@/lib/ufc-predictions";
import { predictUfcFight, type UfcPredictionResponse } from "@/lib/ufc-ranker-api";
import type { FighterPortrait } from "@/lib/thesportsdb";
import type { UfcDisplayEvent, UfcFighter } from "@/lib/ufc-data";

const featureItems = [
  ["FIGHT DATA", "Historical results, methods and event context."],
  ["MATCHUP MODELS", "Opponent-specific outputs shaped around the fight."],
  ["EVENT FLOW", "Upcoming cards feed the same prediction pipeline."],
  ["EXPLAINABLE OUTPUT", "Confidence, probabilities and model notes."],
] as const;

const defaultFight = {
  blue_fighter_name: "Salahdine Parnasse",
  fight_date: "2026-09-04",
  red_fighter_name: "Dan Hooker",
  title_fight: false,
  weight_class: "Lightweight",
};

function getPortrait(portraits: FighterPortrait[], name?: string | null) {
  return portraits.find((portrait) => portrait.originalName.toLowerCase() === name?.toLowerCase());
}

function fighterLastName(name: string) {
  return name.split(" ").at(-1) ?? name;
}

function formatEventDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  return {
    day: new Intl.DateTimeFormat("en-US", { day: "2-digit" }).format(date),
    label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date).toUpperCase(),
    year: new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(date),
  };
}

function FutureFightCard({ event, portraits }: { event: UfcDisplayEvent; portraits: FighterPortrait[] }) {
  const date = formatEventDate(event.date);
  const mainFight = event.fights[0];
  const redPortrait = getPortrait(portraits, mainFight?.red.name);
  const bluePortrait = getPortrait(portraits, mainFight?.blue.name);

  return (
    <Link className="ufc-fight-card reveal" href={`/events/${event.eventId}`}>
      <div className="ufc-fight-card-visual">
        <div className="ufc-fight-card-date">
          <span>{date.label}</span>
          <strong>{date.day}</strong>
          <small>{date.year}</small>
        </div>
        <div className="ufc-fight-card-fighters">
          <div className="ufc-fight-card-face red-face">
            {redPortrait?.imageUrl ? (
              <Image alt="" height={200} src={redPortrait.imageUrl} unoptimized width={200} />
            ) : (
              <Image alt="" height={200} src="/UFC/silueta.png" width={200} />
            )}
          </div>
          <div className="ufc-fight-card-vs">VS</div>
          <div className="ufc-fight-card-face blue-face">
            {bluePortrait?.imageUrl ? (
              <Image alt="" height={200} src={bluePortrait.imageUrl} unoptimized width={200} />
            ) : (
              <Image alt="" height={200} src="/UFC/silueta.png" width={200} />
            )}
          </div>
        </div>
      </div>
      <div className="ufc-fight-card-copy">
        <small>{event.shortName}</small>
        <h3>
          {mainFight
            ? `${fighterLastName(mainFight.red.name)} vs ${fighterLastName(mainFight.blue.name)}`
            : event.name}
        </h3>
        <p>
          {event.venue} · {event.location}
        </p>
        <span>View event →</span>
      </div>
    </Link>
  );
}

export function UfcLandingPage({
  fighters,
  events,
  portraits,
}: {
  fighters: UfcFighter[];
  events: UfcDisplayEvent[];
  portraits: FighterPortrait[];
}) {
  const { loading: authLoading, premiumLoading, user } = useAuth();
  const [redFighterName, setRedFighterName] = useState(defaultFight.red_fighter_name);
  const [blueFighterName, setBlueFighterName] = useState(defaultFight.blue_fighter_name);
  const [fightDate, setFightDate] = useState(defaultFight.fight_date);
  const [weightClass, setWeightClass] = useState(defaultFight.weight_class);
  const [titleFight, setTitleFight] = useState(defaultFight.title_fight);
  const [result, setResult] = useState<UfcPredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const futureEvents = events.slice(0, 3);
  const redFighter = useMemo(
    () => fighters.find((fighter) => fighter.name === redFighterName) ?? null,
    [fighters, redFighterName],
  );
  const blueFighter = useMemo(
    () => fighters.find((fighter) => fighter.name === blueFighterName) ?? null,
    [fighters, blueFighterName],
  );
  const winner = result?.prediction;

  const fightKey = useMemo(
    () =>
      redFighter && blueFighter
        ? `${redFighter.fighterId}:${blueFighter.fighterId}:${fightDate}:${weightClass}:${titleFight ? "1" : "0"}`
        : null,
    [blueFighter, fightDate, redFighter, titleFight, weightClass],
  );

  async function runPrediction() {
    if (authLoading || premiumLoading) return;

    if (!redFighter || !blueFighter) {
      setError("Choose both fighters before running a prediction.");
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!fightKey) {
      setError("Fight key unavailable.");
      return;
    }

    setError(null);
    setResult(null);
    setRunning(true);

    try {
      await checkUfcPredictionQuota({ fight_key: fightKey });

      const prediction = await predictUfcFight({
        blue_fighter_id: blueFighter.fighterId,
        fight_date: fightDate || null,
        red_fighter_id: redFighter.fighterId,
        title_fight: titleFight,
        weight_class: weightClass || null,
      });
      setResult(prediction);

      await saveUfcPrediction({
        event_id: null,
        event_name: null,
        fight_id: null,
        fight_key: fightKey,
        fight_name: `${redFighter.name} vs ${blueFighter.name}`,
        prediction_payload: prediction,
        request_payload: {
          blue_fighter_id: blueFighter.fighterId,
          fight_date: fightDate || null,
          red_fighter_id: redFighter.fighterId,
          title_fight: titleFight,
          weight_class: weightClass || null,
        },
        source: "ufc",
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The fight prediction could not be run.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="ufc-page">
      <section className="ufc-hero">
        <Image
          alt=""
          aria-hidden="true"
          className="ufc-hero-image"
          fill
          priority
          sizes="100vw"
          src="/UFC/ufc_hero.png"
        />
        <div className="ufc-hero-overlay" />
        <div className="ufc-hero-content reveal">
          <p className="tech-label ufc-label">UFC FIGHT MODEL</p>
          <h1>
            AI fight predictions.
            <span>Built around matchup data.</span>
          </h1>
          <p>
            Machine learning models that analyze fighter history, matchup context and event data
            to produce model-driven fight analysis.
          </p>
          <div className="platform-hero-actions">
            <a className="button-primary ufc-primary" href="#predictor">
              Run UFC prediction <span>→</span>
            </a>
            <Link className="button-secondary" href="/events">
              Explore events <span>→</span>
            </Link>
          </div>
          <small>UFC • FIGHT ANALYSIS • MODEL OUTPUT</small>
        </div>
        <div className="scroll-cue ufc-scroll-cue" aria-hidden="true">
          <span />
          <small>SCROLL</small>
        </div>
      </section>

      <section className="dark-entry ufc-entry">
        <p className="tech-label reveal">BUILT AROUND THE DATA</p>
        <h2 className="reveal">Fight analysis designed for competition.</h2>
        <p className="reveal">
          GRDX1 turns historical results, fighter attributes and event-specific context into
          machine learning outputs you can review before the fight.
        </p>
      </section>

      <section className="landing-section ufc-future-section">
        <div className="section-heading reveal">
          <p className="tech-label ufc-label">UPCOMING FIGHTS</p>
          <h2>Select the next event.</h2>
          <Link href="/events">View all events →</Link>
        </div>
        <div className="ufc-fight-grid">
          {futureEvents.map((event) => (
            <FutureFightCard event={event} key={event.eventId} portraits={portraits} />
          ))}
        </div>
      </section>

      <section className="landing-section prediction-experience ufc-predictor-section" id="predictor">
        <div className="prediction-copy reveal">
          <p className="tech-label ufc-label">PREDICTION</p>
          <h2>
            BUILD A
            <br />
            MATCHUP.
          </h2>
          <p>
            Choose fighters by name. GRDX1 maps each selection to the model dataset internally and
            sends only the fighter identifiers needed by the prediction API.
          </p>
          <Link className="red-cta" href="/events">
            Browse events <span>→</span>
          </Link>
        </div>

        <div className="ufc-predictor-panel reveal">
          <AuthRequiredModal open={showAuthModal} onClose={() => setShowAuthModal(false)} variant="inline" />
          <div className="ufc-corner-grid">
            <label className="field">
              Red fighter
              <select value={redFighterName} onChange={(event) => setRedFighterName(event.target.value)}>
                {fighters.map((fighter) => (
                  <option key={fighter.fighterId} value={fighter.name}>
                    {fighter.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Blue fighter
              <select value={blueFighterName} onChange={(event) => setBlueFighterName(event.target.value)}>
                {fighters.map((fighter) => (
                  <option key={fighter.fighterId} value={fighter.name}>
                    {fighter.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="ufc-selected-fighters">
            {[redFighter, blueFighter].map((fighter, index) => (
              <article key={`${fighter?.fighterId ?? index}-selected`}>
                <span>{index === 0 ? "Red corner" : "Blue corner"}</span>
                <strong>{fighter?.name ?? "Select fighter"}</strong>
                <small>
                  {fighter?.record ?? "--"} · {fighter?.height ?? "--"} · {fighter?.reach ?? "--"} reach
                </small>
              </article>
            ))}
          </div>
          <div className="ufc-corner-grid">
            <label className="field">
              Fight date
              <input type="date" value={fightDate} onChange={(event) => setFightDate(event.target.value)} />
            </label>
            <label className="field">
              Weight class
              <input
                value={weightClass}
                onChange={(event) => setWeightClass(event.target.value)}
                placeholder="Lightweight"
              />
            </label>
          </div>
          <label className="ufc-checkbox">
            <input
              checked={titleFight}
              onChange={(event) => setTitleFight(event.target.checked)}
              type="checkbox"
            />
            Title fight
          </label>
          <button
            className="button-primary ufc-primary"
            disabled={running || !hydrated || authLoading || premiumLoading}
            onClick={runPrediction}
            type="button"
          >
            {running ? "Running model" : "Run prediction"} <span>→</span>
          </button>
          {error ? <div className="wizard-error">{error}</div> : null}

          <div className="ufc-result">
            <div className="ufc-probabilities">
              <div className={winner?.winner_side === "red" ? "active" : ""}>
                <span>Red</span>
                <strong>{winner ? `${(winner.red_win_probability * 100).toFixed(1)}%` : "--"}</strong>
              </div>
              <div className={winner?.winner_side === "blue" ? "active" : ""}>
                <span>Blue</span>
                <strong>{winner ? `${(winner.blue_win_probability * 100).toFixed(1)}%` : "--"}</strong>
              </div>
            </div>
            <footer>
              <span>Model output</span>
              <b>{winner?.winner_name ?? "Awaiting prediction"}</b>
              <small>Confidence {winner ? `${winner.confidence_pct.toFixed(1)}%` : "--"}</small>
            </footer>
          </div>
        </div>
      </section>

      <section className="photo-break ufc-photo-break">
        <Image
          alt=""
          aria-hidden="true"
          className="photo-break-image"
          fill
          sizes="100vw"
          src="/UFC/jaula_esquina_inferior_derecha.png"
        />
        <div className="photo-break-fade" />
        <div className="ufc-photo-break-content reveal">
          <h2>
            DATA DOESN&apos;T GUESS.
            <br />
            IT <span>LEARNS.</span>
          </h2>
          <div className="feature-line ufc-feature-line">
            {featureItems.map(([title, copy]) => (
              <article className="feature-item" key={title}>
                <span />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
