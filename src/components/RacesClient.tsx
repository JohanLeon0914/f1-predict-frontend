"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  getHealth,
  getLocalF1Data,
  getMetrics,
  predictRace,
} from "@/lib/f1-ranker-api";
import { ensureGuestId, savePrediction } from "@/lib/supabase";
import type {
  DriverOption,
  LocalF1Data,
  ParticipantRequest,
  PredictionItem,
  PredictionRequest,
  PredictionResponse,
  Race,
  SavedPrediction,
} from "@/lib/types";

type Step = 1 | 2 | 3;

type AveragedPrediction = PredictionItem & {
  average_position: number;
  average_score: number;
  runs: number;
};

function normalizeSimulationCount(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 3);
  if (!digits) return 1;
  return Math.min(Math.max(Number(digits), 1), 100);
}

const steps: Array<{ id: Step; title: string; copy: string }> = [
  { id: 1, title: "Choose a race", copy: "Select a future calendar event" },
  { id: 2, title: "Drivers & prediction", copy: "Configure and run the simulation" },
  { id: 3, title: "Results", copy: "Review rankings and metrics" },
];

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const countryFlags: Record<string, string> = {
  Australia: "🇦🇺", Austria: "🇦🇹", Azerbaijan: "🇦🇿", Bahrain: "🇧🇭", Belgium: "🇧🇪",
  Brazil: "🇧🇷", Canada: "🇨🇦", China: "🇨🇳", France: "🇫🇷", Germany: "🇩🇪", Hungary: "🇭🇺",
  Italy: "🇮🇹", Japan: "🇯🇵", Mexico: "🇲🇽", Monaco: "🇲🇨", Netherlands: "🇳🇱", Qatar: "🇶🇦",
  Russia: "🇷🇺", Saudi: "🇸🇦", Singapore: "🇸🇬", Spain: "🇪🇸", Turkey: "🇹🇷", UAE: "🇦🇪",
  "United Kingdom": "🇬🇧", "United States": "🇺🇸", "United States of America": "🇺🇸",
};

function toNullableNumber(value: string) {
  const raw = value.trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableText(value: string) {
  const raw = value.trim();
  return raw ? raw : null;
}

function buildBaselineRoster(data: LocalF1Data): ParticipantRequest[] {
  const latestByDriver = new Map(
    data.latestParticipants.map((participant) => [participant.driverId, participant]),
  );

  return data.drivers.map((driver, index) => {
    const latest = latestByDriver.get(driver.driverId);
    return {
      driverId: driver.driverId,
      constructorId: driver.constructorId,
      grid: latest?.grid ?? index + 1,
      qualifying_position: latest?.qualifying_position ?? index + 1,
      q1: latest?.q1 ?? null,
      q2: latest?.q2 ?? null,
      q3: latest?.q3 ?? null,
    };
  });
}

function buildAverages(items: PredictionItem[][]): AveragedPrediction[] {
  const grouped = new Map<number, { position: number; score: number; runs: number }>();

  for (const run of items) {
    for (const item of run) {
      const current = grouped.get(item.driverId) ?? { position: 0, score: 0, runs: 0 };
      current.position += item.predicted_position;
      current.score += item.score;
      current.runs += 1;
      grouped.set(item.driverId, current);
    }
  }

  return Array.from(grouped.entries())
    .map(([driverId, value]) => ({
      driverId,
      predicted_position: 0,
      score: value.score / value.runs,
      average_position: value.position / value.runs,
      average_score: value.score / value.runs,
      runs: value.runs,
    }))
    .sort((a, b) => a.average_position - b.average_position)
    .map((item, index) => ({ ...item, predicted_position: index + 1 }));
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${monthNames[Number(month) - 1]} ${day}, ${year}`;
}

function getCountryFlag(country?: string) {
  return countryFlags[country ?? ""] ?? "🏁";
}

function getMetric(metrics: Record<string, unknown> | null, split: string, key: string) {
  const splitValue = metrics?.[split];
  if (!splitValue || typeof splitValue !== "object") return null;
  const value = (splitValue as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
}

const trackPaths = [
  "M18 57 C29 25, 67 15, 91 31 C107 42, 111 63, 139 54 C166 46, 179 67, 153 78 C125 90, 98 68, 72 72 C45 77, 8 83, 18 57Z",
  "M24 63 C19 33, 51 21, 74 30 C94 38, 93 10, 117 17 C151 27, 160 62, 136 73 C112 84, 94 58, 63 72 C43 80, 27 77, 24 63Z",
  "M17 45 C31 19, 72 20, 88 42 C102 61, 137 18, 162 38 C181 54, 162 79, 132 71 C105 64, 91 78, 58 72 C28 66, 8 62, 17 45Z",
  "M33 69 C13 48, 33 20, 62 24 C87 27, 86 48, 105 52 C130 58, 139 22, 162 31 C181 39, 177 67, 151 74 C120 82, 102 64, 75 71 C55 76, 43 79, 33 69Z",
  "M20 63 C30 40, 49 30, 73 35 C94 39, 94 17, 119 20 C145 24, 169 46, 156 64 C143 82, 112 65, 86 72 C55 81, 8 91, 20 63Z",
];

function CircuitOutline({ active = false, seed = 0 }: { active?: boolean; seed?: number }) {
  const path = trackPaths[Math.abs(seed) % trackPaths.length];
  return (
    <svg className={active ? "wizard-track active" : "wizard-track"} viewBox="0 0 190 92" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function DriverHelmet({ driver }: { driver?: DriverOption }) {
  if (driver?.headshotUrl) {
    return (
      <Image
        alt={`${driver.name} headshot`}
        className="driver-headshot"
        height={72}
        src={driver.headshotUrl}
        width={72}
      />
    );
  }

  return (
    <span className="driver-headshot driver-headshot-fallback" aria-hidden="true">
      {driver?.name?.slice(0, 2).toUpperCase() ?? "F1"}
    </span>
  );
}

export function RacesClient() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<LocalF1Data | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<ParticipantRequest[]>([]);
  const [simulationCount, setSimulationCount] = useState(25);
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [health, setHealth] = useState<"checking" | "ok" | "error">("checking");
  const [result, setResult] = useState<AveragedPrediction[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [savedMode, setSavedMode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureGuestId();
    Promise.allSettled([getLocalF1Data(), getHealth(), getMetrics()]).then(
      ([localData, healthResult, metricsResult]) => {
        if (localData.status === "fulfilled") {
          const nextRace = localData.value.races.find((race) => race.status === "future");
          setData(localData.value);
          setSelectedRaceId(nextRace?.raceId ?? null);
          setParticipants(
            (nextRace && localData.value.participantsByRace[String(nextRace.raceId)]) ??
              buildBaselineRoster(localData.value),
          );
        } else {
          setError(localData.reason instanceof Error ? localData.reason.message : "The race calendar could not be loaded.");
        }
        setHealth(healthResult.status === "fulfilled" ? "ok" : "error");
        if (metricsResult.status === "fulfilled") setMetrics(metricsResult.value);
      },
    );
  }, []);

  const futureRaces = useMemo(
    () => data?.races.filter((race) => race.status === "future") ?? [],
    [data],
  );

  const selectedRace = useMemo(
    () => futureRaces.find((race) => race.raceId === selectedRaceId) ?? null,
    [futureRaces, selectedRaceId],
  );

  function getDriver(driverId: number) {
    return data?.drivers.find((driver) => driver.driverId === driverId);
  }

  function getTeamName(constructorId: number) {
    return data?.constructors.find((team) => team.constructorId === constructorId)?.name ?? "Equipo";
  }

  function selectRace(race: Race) {
    setSelectedRaceId(race.raceId);
    setParticipants(data?.participantsByRace[String(race.raceId)] ?? (data ? buildBaselineRoster(data) : []));
    setResult([]);
    setSavedMode(null);
  }

  function updateParticipant(index: number, next: ParticipantRequest) {
    setParticipants((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? next : item)),
    );
  }

  function removeParticipant(index: number) {
    setParticipants((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function resetRoster() {
    if (!data) return;
    setParticipants(data.participantsByRace[String(selectedRaceId)] ?? buildBaselineRoster(data));
    setResult([]);
    setSavedMode(null);
  }

  async function runPrediction() {
    if (!selectedRace) {
      setError("Choose a race before running a prediction.");
      return;
    }

    const cleanParticipants = participants.filter(
      (participant) => participant.driverId && participant.constructorId,
    );

    if (cleanParticipants.length < 2) {
      setError("Keep at least two drivers to run the prediction.");
      return;
    }

    const payload: PredictionRequest = {
      race_id: selectedRace.raceId,
      circuit_id: selectedRace.circuitId,
      race_date: selectedRace.date,
      participants: cleanParticipants,
    };

    setError(null);
    setSavedMode(null);
    setResult([]);
    setRunning(true);
    setProgress(0);

    try {
      const total = Math.min(Math.max(simulationCount, 1), 100);
      const runs: PredictionResponse[] = [];

      for (let index = 0; index < total; index += 1) {
        const prediction = await predictRace(payload);
        runs.push(prediction);
        setProgress(index + 1);
      }

      const averaged = buildAverages(runs.map((run) => run.predictions));
      setResult(averaged);

      const saved: SavedPrediction = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        source: "races",
        simulation_count: total,
        race: {
          raceId: selectedRace.raceId,
          circuitId: selectedRace.circuitId,
          name: selectedRace.name,
          date: selectedRace.date,
        },
        request: payload,
        averaged_predictions: averaged,
        raw_predictions: runs,
      };
      const saveResult = await savePrediction(saved);
      setSavedMode(saveResult.mode === "supabase" ? "Supabase" : "localStorage");
      setStep(3);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The prediction could not be run.");
    } finally {
      setRunning(false);
    }
  }

  const winner = result[0];
  const winnerDriver = winner ? getDriver(winner.driverId) : null;
  const testNdcg = getMetric(metrics, "test", "ndcg");
  const testSpearman = getMetric(metrics, "test", "spearman");
  const testKendall = getMetric(metrics, "test", "kendall_tau");
  const testMae = getMetric(metrics, "test", "mae_position");
  const top3 = getMetric(metrics, "test", "top3_accuracy");
  const top10 = getMetric(metrics, "test", "top10_accuracy");

  return (
    <div className="races-wizard page-shell mx-auto max-w-[118rem] px-4 pb-10">
      <div className="wizard-steps" aria-label="Prediction process">
        {steps.map((item, index) => (
          <button
            className={`wizard-step ${step === item.id ? "active" : ""} ${step > item.id ? "done" : ""}`}
            disabled={item.id === 3 && !result.length}
            key={item.id}
            onClick={() => setStep(item.id)}
            type="button"
          >
            <span>{String(item.id).padStart(2, "0")}</span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.copy}</small>
            </div>
            {index < steps.length - 1 ? <i /> : null}
          </button>
        ))}
      </div>

      {error ? <div className="wizard-error">{error}</div> : null}

      <section className={`wizard-pane ${step === 1 ? "active" : ""}`} hidden={step !== 1}>
        <div className="wizard-panel">
          <div className="wizard-panel-header">
            <div>
              <p className="tech-label">STEP 01</p>
              <h1>Race calendar</h1>
              <p>Select a future race to prepare your prediction.</p>
            </div>
            <span className={`status ${health === "ok" ? "status-ok" : "status-error"}`}>
              API {health === "ok" ? "online" : health === "checking" ? "checking" : "offline"}
            </span>
            <button className="button-primary calendar-continue" disabled={!selectedRace} onClick={() => setStep(2)} type="button">
              Continue <span>→</span>
            </button>
          </div>

          {!data ? (
            <div className="race-card-grid race-card-grid-loading" aria-label="Loading races" aria-live="polite">
              {Array.from({ length: 3 }, (_, index) => (
                <div className="race-card-skeleton" key={index}>
                  <span className="skeleton-index" />
                  <span className="skeleton-flag" />
                  <span className="skeleton-track" />
                  <span className="skeleton-copy skeleton-copy-title" />
                  <span className="skeleton-copy skeleton-copy-line" />
                  <span className="skeleton-date" />
                </div>
              ))}
            </div>
          ) : null}

          <div className={`race-card-grid ${!data ? "race-card-grid-hidden" : ""}`}>
            {futureRaces.map((race, index) => (
              <button
                className={`future-race-card ${race.raceId === selectedRaceId ? "selected" : ""}`}
                key={race.raceId}
                onClick={() => selectRace(race)}
                type="button"
              >
                <div className="race-card-index">{String(index + 1).padStart(2, "0")}</div>
                <span className="race-flag" aria-label={`${race.circuit?.country ?? "Unknown"} flag`}>{getCountryFlag(race.circuit?.country)}</span>
                <CircuitOutline active={race.raceId === selectedRaceId} seed={race.circuitId} />
                <div className="race-card-copy">
                  <strong>{race.name}</strong>
                  <span>{race.circuit?.name ?? "Circuit to be confirmed"}</span>
                  <small>{race.circuit?.country ?? "F1"} · Round {race.round}</small>
                </div>
                <div className="race-card-date">
                  <b>{formatDate(race.date)}</b>
                </div>
              </button>
            ))}
          </div>

          <div className="wizard-actions wizard-actions-hidden">
            <button
              className="button-primary"
              disabled={!selectedRace}
              onClick={() => setStep(2)}
              type="button"
            >
              Continue <span>→</span>
            </button>
          </div>
        </div>
      </section>

      <section className={`wizard-pane ${step === 2 ? "active" : ""}`} hidden={step !== 2}>
        <div className="wizard-panel">
          <div className="race-context">
            <div>
              <p className="tech-label">STEP 02</p>
              <h1>{selectedRace?.name ?? "Selected race"}</h1>
              <p>
                {selectedRace?.circuit?.name ?? "Circuit"} · {selectedRace ? formatDate(selectedRace.date) : "Date"}
              </p>
            </div>
            <CircuitOutline active seed={selectedRace?.circuitId ?? 0} />
            <div className="context-stat">
              <span>Round</span>
              <b>{selectedRace?.round ?? "-"}</b>
            </div>
          </div>

          <div className="simulation-toolbar">
            <label className="field">
              Simulations
              <input
                inputMode="numeric"
                maxLength={3}
                pattern="[0-9]*"
                type="text"
                value={simulationCount}
                onChange={(event) => setSimulationCount(normalizeSimulationCount(event.target.value))}
              />
            </label>
            <button className="button-secondary" onClick={resetRoster} type="button">
              Reset grid
            </button>
            <button className="button-secondary" onClick={() => setStep(1)} type="button">
              Change race
            </button>
            <button className="button-primary" disabled={running} onClick={runPrediction} type="button">
              {running ? `Running ${progress}/${simulationCount}` : "Run prediction"} <span>→</span>
            </button>
          </div>

          <div className="driver-config-list">
            {participants.map((participant, index) => {
              const driver = getDriver(participant.driverId);

              return (
                <article className="driver-config-row" key={`${participant.driverId}-${index}`}>
                  <div className="driver-main">
                    <span className="driver-pos">{index + 1}</span>
                    <DriverHelmet driver={driver} />
                    <label>
                      Driver
                      <select
                        value={participant.driverId}
                        onChange={(event) => {
                          const nextDriver = data?.drivers.find(
                            (item) => item.driverId === Number(event.target.value),
                          );
                          updateParticipant(index, {
                            ...participant,
                            driverId: Number(event.target.value),
                            constructorId: nextDriver?.constructorId ?? participant.constructorId,
                          });
                        }}
                      >
                        {data?.drivers.map((item) => (
                          <option key={item.driverId} value={item.driverId}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="driver-fields">
                    <label>
                      Team
                      <select
                        value={participant.constructorId}
                        onChange={(event) =>
                          updateParticipant(index, {
                            ...participant,
                            constructorId: Number(event.target.value),
                          })
                        }
                      >
                        {data?.constructors.map((team) => (
                          <option key={team.constructorId} value={team.constructorId}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Grid
                      <input
                        inputMode="numeric"
                        value={participant.grid ?? ""}
                        onChange={(event) =>
                          updateParticipant(index, {
                            ...participant,
                            grid: toNullableNumber(event.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Qualy
                      <input
                        inputMode="numeric"
                        value={participant.qualifying_position ?? ""}
                        onChange={(event) =>
                          updateParticipant(index, {
                            ...participant,
                            qualifying_position: toNullableNumber(event.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Q1
                      <input
                        value={participant.q1 ?? ""}
                        onChange={(event) =>
                          updateParticipant(index, {
                            ...participant,
                            q1: toNullableText(event.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Q2
                      <input
                        value={participant.q2 ?? ""}
                        onChange={(event) =>
                          updateParticipant(index, {
                            ...participant,
                            q2: toNullableText(event.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Q3
                      <input
                        value={participant.q3 ?? ""}
                        onChange={(event) =>
                          updateParticipant(index, {
                            ...participant,
                            q3: toNullableText(event.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                  <button
                    aria-label={`Remove ${driver?.name ?? "driver"}`}
                    className="remove-driver"
                    onClick={() => removeParticipant(index)}
                    title="Remove driver"
                    type="button"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M4 7h16M10 11v6m4-6v6M9 7V4h6v3m-9 0 1 14h8l1-14" />
                    </svg>
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={`wizard-pane ${step === 3 ? "active" : ""}`} hidden={step !== 3}>
        <div className="wizard-panel results-panel">
          <div className="wizard-panel-header">
            <div>
              <p className="tech-label">STEP 03</p>
              <h1>Simulation results</h1>
              <p>
                {selectedRace?.name ?? "Race"} · {simulationCount} simulations
                {savedMode ? ` · Saved to ${savedMode}` : ""}
              </p>
            </div>
            <button className="button-secondary" onClick={() => setStep(2)} type="button">
              Adjust prediction
            </button>
          </div>

          <div className="results-grid">
            <article className="winner-card">
              <div>
                <span>Most likely winner</span>
                <h2>{winnerDriver?.name ?? "No winner yet"}</h2>
                <p>{winnerDriver?.teamName ?? "Run a prediction"}</p>
              </div>
              <DriverHelmet driver={winnerDriver ?? undefined} />
              <div className="probability-ring">{winner ? winner.average_score.toFixed(2) : "--"}</div>
            </article>

            <article className="ranking-card">
              <h3>Predicted ranking</h3>
              {result.map((item) => {
                const driver = getDriver(item.driverId);
                const width = Math.max(10, 100 - (item.predicted_position - 1) * 4);

                return (
                  <div className="ranking-row" key={item.driverId}>
                    <span>{item.predicted_position}</span>
                    <DriverHelmet driver={driver} />
                    <div>
                      <strong>{driver?.name ?? `Driver ${item.driverId}`}</strong>
                      <small>
                        {driver?.teamName ?? getTeamName(participants.find((p) => p.driverId === item.driverId)?.constructorId ?? 0)}
                      </small>
                    </div>
                    <i style={{ width: `${width}%` }} />
                    <b>{item.average_position.toFixed(2)}</b>
                  </div>
                );
              })}
            </article>

            <article className="metrics-card">
              <h3>Model metrics</h3>
              <dl>
                <div><dt>NDCG</dt><dd>{testNdcg?.toFixed(3) ?? "-"}</dd></div>
                <div><dt>Spearman</dt><dd>{testSpearman?.toFixed(3) ?? "-"}</dd></div>
                <div><dt>Kendall tau</dt><dd>{testKendall?.toFixed(3) ?? "-"}</dd></div>
                <div><dt>Position MAE</dt><dd>{testMae?.toFixed(2) ?? "-"}</dd></div>
                <div><dt>Top 3 accuracy</dt><dd>{top3?.toFixed(2) ?? "-"}</dd></div>
                <div><dt>Top 10 accuracy</dt><dd>{top10?.toFixed(2) ?? "-"}</dd></div>
              </dl>
            </article>

            <article className="metrics-card">
              <h3>Simulation info</h3>
              <dl>
                <div><dt>Simulations</dt><dd>{simulationCount}</dd></div>
                <div><dt>Drivers</dt><dd>{participants.length}</dd></div>
                <div><dt>Race date</dt><dd>{selectedRace ? formatDate(selectedRace.date) : "-"}</dd></div>
                <div><dt>API ML</dt><dd>{health === "ok" ? "Online" : "Offline"}</dd></div>
              </dl>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
