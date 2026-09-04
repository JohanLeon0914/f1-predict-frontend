"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthRequiredModal } from "@/components/AuthRequiredModal";
import { useAuth } from "@/components/AuthProvider";
import {
  buildUfcFightKey,
  checkUfcPredictionQuota,
  saveUfcPrediction,
} from "@/lib/ufc-predictions";
import {
  getUfcHealth,
  getUfcMetrics,
  predictUfcFight,
  type UfcMetrics,
  type UfcPredictionResponse,
} from "@/lib/ufc-ranker-api";
import type { UfcFighter } from "@/lib/ufc-data";

const modelStats = [
  ["Accuracy", "test", "accuracy"],
  ["ROC AUC", "test", "roc_auc"],
  ["Log loss", "test", "log_loss"],
  ["Brier", "test", "brier_score"],
] as const;

const defaultFight = {
  blue_fighter_name: "Salahdine Parnasse",
  fight_date: "2026-09-04",
  red_fighter_name: "Dan Hooker",
  title_fight: false,
  weight_class: "Lightweight",
};

function metricValue(metrics: UfcMetrics | null, split: string, key: string) {
  const value = metrics?.metrics?.[split]?.[key];
  return typeof value === "number" ? value.toFixed(key.includes("loss") ? 3 : 2) : "--";
}

export function UfcLandingPage({ fighters }: { fighters: UfcFighter[] }) {
  const { loading: authLoading, premiumLoading, user } = useAuth();
  const [health, setHealth] = useState<"checking" | "ok" | "error">("checking");
  const [metrics, setMetrics] = useState<UfcMetrics | null>(null);
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
    Promise.allSettled([getUfcHealth(), getUfcMetrics()]).then(([healthResult, metricsResult]) => {
      setHealth(healthResult.status === "fulfilled" ? "ok" : "error");
      if (metricsResult.status === "fulfilled") setMetrics(metricsResult.value);
    });
  }, []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const winnerSide = result?.prediction?.winner_side;
  const redProbability = result?.prediction?.red_win_probability ?? 0;
  const blueProbability = result?.prediction?.blue_win_probability ?? 0;
  const winnerName = result?.prediction?.winner_name;

  const confidenceLabel = useMemo(() => {
    const value = result?.prediction?.confidence_pct;
    return typeof value === "number" ? `${value.toFixed(1)}%` : "--";
  }, [result]);

  const redFighter = useMemo(
    () => fighters.find((fighter) => fighter.name === redFighterName) ?? null,
    [fighters, redFighterName],
  );
  const blueFighter = useMemo(
    () => fighters.find((fighter) => fighter.name === blueFighterName) ?? null,
    [fighters, blueFighterName],
  );
  const fightKey = useMemo(
    () =>
      redFighter && blueFighter
        ? buildUfcFightKey({
            blueFighterId: blueFighter.fighterId,
            fightDate,
            redFighterId: redFighter.fighterId,
            titleFight,
            weightClass,
          })
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

    setError(null);
    setResult(null);
    setRunning(true);

    try {
      if (!fightKey) {
        throw new Error("Fight key unavailable.");
      }

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
      <AuthRequiredModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
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
            Analyze fighter history, style indicators, head-to-head context and model confidence
            before exploring the final prediction output.
          </p>
          <div className="platform-hero-actions">
            <a className="button-primary ufc-primary" href="#predictor">
              Run UFC prediction <span>→</span>
            </a>
            <Link className="button-secondary" href="/events">
              Explore events <span>→</span>
            </Link>
          </div>
        </div>
        <div className="ufc-hero-panel reveal" aria-hidden="true">
          <span>MODEL STATUS</span>
          <b>{health === "checking" ? "CHECKING" : health === "ok" ? "ONLINE" : "OFFLINE"}</b>
          <small>Fight prediction API</small>
        </div>
      </section>

      <section className="landing-section ufc-model-section">
        <div className="pipeline-heading reveal">
          <p className="tech-label ufc-label">MODEL</p>
          <h2>Prediction system</h2>
          <p>
            The UFC model estimates red-corner and blue-corner win probabilities from historical
            fight features, then exposes confidence and explanation signals.
          </p>
        </div>
        <div className="ufc-metric-grid">
          {modelStats.map(([label, split, key]) => (
            <article className="ufc-stat reveal" key={key}>
              <span>{label}</span>
              <strong>{metricValue(metrics, split, key)}</strong>
              <small>Test split</small>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section ufc-predictor-section" id="predictor">
        <div className="ufc-predictor-copy reveal">
          <p className="tech-label ufc-label">PREDICTION</p>
          <h2>Build a matchup</h2>
          <p>
            Choose fighters by name. GRDX1 maps each selection to the model dataset internally and
            sends only the required fighter identifiers to the prediction API.
          </p>
        </div>

        <div className="ufc-predictor-panel reveal">
          <AuthRequiredModal open={showAuthModal} onClose={() => setShowAuthModal(false)} variant="inline" />
          <div className="ufc-corner-grid">
            <label className="field">
              Red fighter
              <select
                value={redFighterName}
                onChange={(event) => setRedFighterName(event.target.value)}
              >
                {fighters.map((fighter) => (
                  <option key={fighter.fighterId} value={fighter.name}>
                    {fighter.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Blue fighter
              <select
                value={blueFighterName}
                onChange={(event) => setBlueFighterName(event.target.value)}
              >
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
              <input
                type="date"
                value={fightDate}
                onChange={(event) => setFightDate(event.target.value)}
              />
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
          <button className="button-primary ufc-primary" disabled={running || (hydrated && (authLoading || premiumLoading))} onClick={runPrediction} type="button">
            {running ? "Running model" : "Run prediction"} <span>→</span>
          </button>
          {error ? <div className="wizard-error">{error}</div> : null}

          <div className="ufc-result">
            <div className="ufc-probabilities">
              <div className={winnerSide === "red" ? "active" : ""}>
                <span>Red</span>
                <strong>{result ? `${(redProbability * 100).toFixed(1)}%` : "--"}</strong>
              </div>
              <div className={winnerSide === "blue" ? "active" : ""}>
                <span>Blue</span>
                <strong>{result ? `${(blueProbability * 100).toFixed(1)}%` : "--"}</strong>
              </div>
            </div>
            <footer>
              <span>Model output</span>
              <b>{winnerName ?? "Awaiting prediction"}</b>
              <small>Confidence {confidenceLabel}</small>
            </footer>
          </div>
        </div>
      </section>
    </div>
  );
}
