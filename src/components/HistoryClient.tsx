"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CircuitSilhouette } from "@/components/CircuitSilhouette";
import { getDriverImageUrl } from "@/lib/driver-image";
import { getLocalF1Data } from "@/lib/f1-ranker-api";
import { ensureGuestId, loadSavedPredictions } from "@/lib/supabase";
import type { DriverOption, LocalF1Data, PredictionItem, SavedPrediction } from "@/lib/types";

type HistoryClientProps = {
  initialData?: LocalF1Data | null;
};

const monzaPrediction: SavedPrediction = {
  id: "seed-2026-italian-gp-2026-09-05",
  created_at: "2026-09-05T15:30:00.000Z",
  source: "races",
  simulation_count: 1,
  race: {
    raceId: 1181,
    circuitId: 14,
    name: "Italian Grand Prix",
    date: "2026-09-06",
  },
  request: {
    race_id: 1181,
    circuit_id: 14,
    race_date: "2026-09-06",
    participants: [],
  },
  averaged_predictions: [
    { driverId: 1, constructorId: 6, predicted_position: 1, score: 1 },
    { driverId: 847, constructorId: 131, predicted_position: 2, score: 2 },
    { driverId: 863, constructorId: 131, predicted_position: 3, score: 3 },
    { driverId: 830, constructorId: 9, predicted_position: 4, score: 4 },
    { driverId: 846, constructorId: 1, predicted_position: 5, score: 5 },
    { driverId: 857, constructorId: 1, predicted_position: 6, score: 6 },
    { driverId: 844, constructorId: 6, predicted_position: 7, score: 7 },
    { driverId: 865, constructorId: 9, predicted_position: 8, score: 8 },
    { driverId: 859, constructorId: 215, predicted_position: 9, score: 9 },
    { driverId: 866, constructorId: 215, predicted_position: 10, score: 10 },
  ],
};

function DriverAvatar({ driver }: { driver?: DriverOption }) {
  const imageUrl = getDriverImageUrl(driver?.headshotUrl ?? null);

  if (imageUrl) {
    return (
      <Image
        alt={`${driver?.name ?? "Driver"} headshot`}
        className="history-driver-avatar"
        height={54}
        src={imageUrl}
        unoptimized
        width={54}
      />
    );
  }

  return <span className="history-driver-avatar history-driver-avatar-fallback">F1</span>;
}

export function HistoryClient({ initialData = null }: HistoryClientProps) {
  const [items, setItems] = useState<SavedPrediction[]>([monzaPrediction]);
  const [data, setData] = useState<LocalF1Data | null>(initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureGuestId();
    Promise.all([loadSavedPredictions(), getLocalF1Data({ initialData, onUpdate: setData })])
      .then(([predictions, localData]) => {
        const hasSeed = predictions.some((prediction) => prediction.id === monzaPrediction.id);
        setItems(hasSeed ? predictions : [monzaPrediction, ...predictions]);
        setData(localData);
      })
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : "History could not be loaded."),
      );
  }, [initialData]);

  function getDriver(driverId: number) {
    return data?.drivers.find((driver) => driver.driverId === driverId);
  }

  function getRace(item: SavedPrediction) {
    return data?.races.find((race) => race.raceId === item.race.raceId) ?? null;
  }

  function getTeamName(prediction: PredictionItem) {
    return (
      getDriver(prediction.driverId)?.teamName ??
      data?.constructors.find((team) => team.constructorId === prediction.constructorId)?.name ??
      "Team unavailable"
    );
  }

  function hasCompleteQualy(item: SavedPrediction) {
    const participants = data?.participantsByRace[String(item.race.raceId)] ?? [];
    return participants.length >= 20 && participants.every((entry) => entry.q1);
  }

  return (
    <section className="history-page page-shell mx-auto max-w-[92rem] px-4 pb-10">
      <div className="history-hero">
        <div>
          <p className="tech-label">F1 MODEL ARCHIVE</p>
          <h1>Prediction history</h1>
          <p>
            Saved model outputs by race, with race context, circuit silhouette,
            qualifying data status, and predicted order.
          </p>
        </div>
        <div className="history-hero-stat">
          <span>Stored predictions</span>
          <b>{items.length}</b>
        </div>
      </div>

      {error ? <p className="wizard-error">{error}</p> : null}

      <div className="history-grid">
        {items.map((item) => {
          const race = getRace(item);
          const completeQualy = hasCompleteQualy(item);

          return (
            <article className="history-card" key={item.id}>
              <header className="history-card-header">
                <div>
                  <span>{new Date(item.created_at).toLocaleDateString("es-CO")}</span>
                  <h2>{item.race.name}</h2>
                  <p>
                    {race?.circuit?.name ?? "Autodromo Nazionale Monza"} · Race ID {item.race.raceId}
                  </p>
                </div>
                {race ? <CircuitSilhouette active className="history-track" race={race} /> : null}
              </header>

              <div className="history-meta-grid">
                <div>
                  <span>Race date</span>
                  <b>{item.race.date}</b>
                </div>
                <div>
                  <span>Simulations</span>
                  <b>{item.simulation_count}</b>
                </div>
                <div>
                  <span>Qualy data</span>
                  <b>{completeQualy ? "Q1/Q2/Q3 loaded" : "Pending sync"}</b>
                </div>
              </div>

              <div className="history-ranking">
                {item.averaged_predictions.map((prediction) => {
                  const driver = getDriver(prediction.driverId);
                  const width = Math.max(18, 100 - (prediction.predicted_position - 1) * 7);

                  return (
                    <div className="history-ranking-row" key={`${item.id}-${prediction.driverId}`}>
                      <span>{prediction.predicted_position}</span>
                      <DriverAvatar driver={driver} />
                      <div>
                        <strong>{driver?.name ?? `Driver ${prediction.driverId}`}</strong>
                        <small>{getTeamName(prediction)}</small>
                        <i style={{ width: `${width}%` }} />
                      </div>
                      <b>{prediction.score.toFixed(2)}</b>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
