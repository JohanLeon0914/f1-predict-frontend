"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AuthRequiredModal } from "@/components/AuthRequiredModal";
import { useAuth } from "@/components/AuthProvider";
import {
  buildUfcFightKey,
  checkUfcPredictionQuota,
  saveUfcPrediction,
} from "@/lib/ufc-predictions";
import { predictUfcFight, type UfcPredictionResponse } from "@/lib/ufc-ranker-api";
import type { UfcDisplayEvent, UfcFight } from "@/lib/ufc-data";
import type { FighterPortrait } from "@/lib/thesportsdb";

type UfcFightPredictorProps = {
  compact?: boolean;
  event: UfcDisplayEvent;
  fight: UfcFight;
  portraits?: FighterPortrait[];
};

function getPortrait(portraits: FighterPortrait[] | undefined, fighterName: string) {
  return portraits?.find((portrait) => portrait.originalName.toLowerCase() === fighterName.toLowerCase());
}

export function UfcFightPredictor({ compact = false, event, fight, portraits }: UfcFightPredictorProps) {
  const { loading, premiumLoading, user } = useAuth();
  const [prediction, setPrediction] = useState<UfcPredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const result = prediction?.prediction;
  const redProbability = result ? Math.round(result.red_win_probability * 100) : 0;
  const blueProbability = result ? Math.round(result.blue_win_probability * 100) : 0;
  const fightKey = buildUfcFightKey({
    blueFighterId: fight.blue.fighterId,
    eventId: event.eventId,
    fightId: fight.fightId,
    fightDate: event.date,
    redFighterId: fight.red.fighterId,
    titleFight: fight.titleFight,
    weightClass: fight.weightClass,
  });
  const winnerPortrait =
    result?.winner_side === "red"
      ? getPortrait(portraits, fight.red.name)
      : result?.winner_side === "blue"
        ? getPortrait(portraits, fight.blue.name)
    : null;

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function analyzeFight() {
    if (loading || premiumLoading) return;

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setError(null);
    setPrediction(null);
    setRunning(true);

    try {
      await checkUfcPredictionQuota({ fight_key: fightKey });
      const predictionResponse = await predictUfcFight({
        blue_fighter_id: fight.blue.fighterId,
        fight_date: event.date,
        red_fighter_id: fight.red.fighterId,
        title_fight: fight.titleFight,
        weight_class: fight.weightClass,
      });
      setPrediction(predictionResponse);
      await saveUfcPrediction({
        event_id: event.eventId,
        event_name: event.name,
        fight_id: fight.fightId,
        fight_key: fightKey,
        fight_name: `${fight.red.name} vs ${fight.blue.name}`,
        prediction_payload: predictionResponse,
        request_payload: {
          blue_fighter_id: fight.blue.fighterId,
          fight_date: event.date,
          red_fighter_id: fight.red.fighterId,
          title_fight: fight.titleFight,
          weight_class: fight.weightClass,
        },
        source: "ufc",
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Prediction unavailable.");
    } finally {
      setRunning(false);
    }
  }

  if (compact) {
    return (
      <div className="ufc-compact-predictor">
        <AuthRequiredModal open={showAuthModal} onClose={() => setShowAuthModal(false)} variant="inline" />
        <button
          className="button-secondary"
          disabled={running || !hydrated || loading || premiumLoading}
          onClick={analyzeFight}
          type="button"
        >
          {running ? "Analyzing" : "Analyze"}
        </button>
        {result ? (
          <small>
            {result.winner_name} · {Math.round(result.confidence_pct)}%
          </small>
        ) : null}
        {error ? <small>{error}</small> : null}
      </div>
    );
  }

  return (
    <div className="ufc-main-predictor" id="stats">
      <AuthRequiredModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      {!result ? (
        <div className="ufc-run-card">
          <span className="ufc-run-icon">▥</span>
          <h3>Run GRDX1 prediction</h3>
          <p>Analyze stats, recent form and historical data to get the AI prediction for this fight.</p>
          <button
            className="button-primary ufc-primary"
            disabled={running || !hydrated || loading || premiumLoading}
            onClick={analyzeFight}
            type="button"
          >
            {running ? "Analyzing fight" : "Analyze Fight"} <span>→</span>
          </button>
        </div>
      ) : null}
      {result ? (
        <div className="ufc-prediction-ready">
          <div className="ufc-prediction-winner">
            <div className="ufc-prediction-portrait">
              {winnerPortrait?.imageUrl ? (
                <Image alt={`${result.winner_name} portrait`} height={120} src={winnerPortrait.imageUrl} unoptimized width={120} />
              ) : (
                <Image alt="" height={120} src="/UFC/silueta.png" width={120} />
              )}
            </div>
            <div className="ufc-prediction-heading">
              <span>GRDX1 PREDICTION</span>
              <strong>{result.winner_name}</strong>
            </div>
          </div>
          <div className="ufc-prediction-score">
            <strong>{redProbability}%</strong>
            <span aria-hidden="true">
              <i style={{ width: `${redProbability}%` }} />
              <b style={{ width: `${blueProbability}%` }} />
            </span>
            <strong>{blueProbability}%</strong>
          </div>
          <div className="ufc-prediction-names">
            <small>{fight.red.name}</small>
            <small>{fight.blue.name}</small>
          </div>
          <p>
            GRDX1 predicts {result.winner_name} has the higher chance based on the model output for this matchup.
          </p>
        </div>
      ) : null}
      {error ? <small>{error}</small> : null}
    </div>
  );
}
