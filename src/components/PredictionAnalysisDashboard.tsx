"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type {
  ConstructorOption,
  DriverOption,
  PredictionContribution,
  PredictionDashboardDriver,
  PredictionDashboardStats,
  PredictionResponse,
  Race,
} from "@/lib/types";
import { getDriverImageUrl } from "@/lib/driver-image";

type Props = {
  constructors: ConstructorOption[];
  drivers: DriverOption[];
  race: Race | null;
  response: PredictionResponse;
};

const statGroupLabels: Record<string, string> = {
  starting_position: "Starting position",
  driver_form: "Driver form",
  driver_circuit_history: "Driver circuit history",
  constructor_form: "Constructor form",
  constructor_circuit_fit: "Constructor circuit fit",
  constructor_pair: "Constructor pair",
  circuit_profile: "Circuit profile",
};

const featureLabels: Record<string, string> = {
  grid: "Starting grid position",
  grid_rank_within_race: "Grid rank in this race",
  qualifying_position: "Qualifying position",
  qualifying_gap_to_pole_ms: "Gap to pole",
  q1_ms: "Q1 lap time",
  q2_ms: "Q2 lap time",
  q3_ms: "Q3 lap time",
  driver_points_prev: "Driver points last season",
  driver_wins_prev: "Driver wins last season",
  driver_season_points_before_race: "Driver season points",
  driver_last_3_avg_finish_position: "Driver last 3 average finish",
  driver_last_5_top3_rate: "Driver last 5 podium rate",
  driver_last_10_top3_rate: "Driver last 10 podium rate",
  driver_last_10_top10_rate: "Driver last 10 top 10 rate",
  driver_last_10_dnf_rate: "Driver last 10 DNF rate",
  driver_circuit_wins_hist: "Driver wins at this circuit",
  driver_circuit_finish_position_mean_hist: "Driver average finish at this circuit",
  driver_circuit_dnf_rate_hist: "Driver DNF rate at this circuit",
  driver_circuit_pit_stop_count_mean_hist: "Driver average pit stops at this circuit",
  driver_similar_circuit_finish_position_mean_hist: "Driver average finish on similar circuits",
  constructor_points_prev: "Team points last season",
  constructor_wins_prev: "Team wins last season",
  constructor_season_points_before_race: "Team season points",
  constructor_last_3_avg_finish_position: "Team last 3 average finish",
  constructor_last_5_top10_rate: "Team last 5 top 10 rate",
  constructor_circuit_wins_hist: "Team wins at this circuit",
  constructor_circuit_finish_position_mean_hist: "Team average finish at this circuit",
  constructor_circuit_top10_rate_hist: "Team top 10 rate at this circuit",
  constructor_speed_profile_top10_rate_hist: "Team top 10 rate on similar speed tracks",
  constructor_pair_last_3_points: "Team pair points over last 3 races",
  constructor_pair_last_5_points: "Team pair points over last 5 races",
  constructor_pair_last_5_both_top10_rate: "Both cars top 10 rate",
  circuit_speed_score: "Track speed score",
  circuit_aero_load_score: "Track aero load score",
  circuit_corner_density_score: "Track corner density score",
  circuit_is_street: "Street circuit",
};

function formatDate(date?: string | null) {
  if (!date) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatMs(value: unknown) {
  if (typeof value !== "number") return formatValue(value);
  const minutes = Math.floor(value / 60000);
  const seconds = Math.floor((value % 60000) / 1000);
  const millis = Math.round(value % 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function formatValue(value: unknown, mode?: string): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.map((item) => formatValue(item)).join(" / ");
  if (mode === "boolean") return Number(value) ? "Yes" : "No";
  if (typeof value === "number") {
    if (mode === "pct") return `${Math.round(value * 100)}%`;
    if (mode === "score5") return `${value}/5`;
    if (mode === "ms") return `${Math.round(value)} ms`;
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
  }
  return String(value);
}

function formatMetric(value?: number, mode: "number" | "pct" = "number") {
  if (typeof value !== "number") return "-";
  return mode === "pct" ? `${(value * 100).toFixed(1)}%` : value.toFixed(3);
}

function metricMode(feature: string) {
  if (feature.endsWith("_rate")) return "pct";
  if (feature.endsWith("_ms")) return "ms";
  if (feature === "circuit_is_street") return "boolean";
  if (feature.endsWith("_score")) return "score5";
  return undefined;
}

function formatFeatureName(feature: string) {
  if (featureLabels[feature]) return featureLabels[feature];
  return feature
    .replace(/_ms$/u, "")
    .replace(/_hist$/u, "")
    .replace(/_/gu, " ")
    .replace(/\bavg\b/gu, "average")
    .replace(/\bprev\b/gu, "previous")
    .replace(/\bdnf\b/gu, "DNF")
    .replace(/\bq([123])\b/gu, "Q$1")
    .replace(/\btop(\d+)\b/gu, "top $1")
    .replace(/\b\w/gu, (match) => match.toUpperCase());
}

function scoreGroup(group: Record<string, number | string | null> | undefined) {
  if (!group) return 45;
  const values = Object.values(group).filter((value): value is number => typeof value === "number");
  if (!values.length) return 45;
  const positive = values.reduce((total, value) => total + Math.max(0, value), 0) / values.length;
  return Math.max(30, Math.min(95, 45 + positive * 8));
}

function groupEntries(stats?: PredictionDashboardStats) {
  return Object.entries(stats ?? {}).filter(
    (entry): entry is [string, Record<string, number | string | null>] =>
      Boolean(entry[1] && Object.keys(entry[1]).length),
  );
}

function groupTone(groupKey: string) {
  const tones: Record<string, string> = {
    driver_form: "green",
    driver_circuit_history: "teal",
    constructor_form: "orange",
    constructor_circuit_fit: "purple",
    constructor_pair: "yellow",
    circuit_profile: "teal",
  };
  return tones[groupKey] ?? "";
}

function driverContributions(driver: PredictionDashboardDriver): PredictionContribution[] {
  return driver.top_contributions ?? [];
}

function driverName(driverId: number, drivers: DriverOption[]) {
  return drivers.find((driver) => driver.driverId === driverId)?.name ?? `Driver ${driverId}`;
}

function driverPhoto(driverId: number, drivers: DriverOption[]) {
  return drivers.find((driver) => driver.driverId === driverId)?.headshotUrl ?? null;
}

function DriverAnalysisImage({ driverId, drivers }: { driverId: number; drivers: DriverOption[] }) {
  const photo = driverPhoto(driverId, drivers);
  const imageUrl = getDriverImageUrl(photo);
  const [imageFailed, setImageFailed] = useState(false);

  if (imageUrl && !imageFailed) {
    return (
      <Image
        className="analysis-headshot"
        alt={driverName(driverId, drivers)}
        src={imageUrl}
        width={126}
        height={126}
        onError={() => setImageFailed(true)}
        unoptimized
      />
    );
  }

  return <div className="analysis-headshot analysis-headshot-fallback">{driverName(driverId, drivers).slice(0, 2).toUpperCase()}</div>;
}

function teamName(driver: PredictionDashboardDriver, drivers: DriverOption[], constructors: ConstructorOption[]) {
  const constructorName = constructors.find((team) => team.constructorId === driver.constructorId)?.name;
  const catalogTeam = drivers.find((catalogDriver) => catalogDriver.driverId === driver.driverId)?.teamName;
  return constructorName ?? catalogTeam ?? `Team ${driver.constructorId ?? "-"}`;
}

function teamColor(driver: PredictionDashboardDriver, drivers: DriverOption[]) {
  return drivers.find((catalogDriver) => catalogDriver.driverId === driver.driverId)?.teamColor ?? "var(--red)";
}

function RadarChart({ driver }: { driver: PredictionDashboardDriver }) {
  const [tooltip, setTooltip] = useState<{ label: string; score: number; x: number; y: number } | null>(null);
  const stats = driver.dashboard_stats ?? {};
  const items = [
    ["Driver form", stats.driver_form],
    ["Driver circuit", stats.driver_circuit_history],
    ["Team form", stats.constructor_form],
    ["Team fit", stats.constructor_circuit_fit],
    ["Teammate form", stats.constructor_pair],
    ["Track profile", stats.circuit_profile],
  ].map(([label, group]) => ({ label: String(label), score: scoreGroup(group as Record<string, number | string | null> | undefined) }));
  const points = items
    .map((item, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / items.length;
      const radius = (item.score / 100) * 128;
      return `${180 + Math.cos(angle) * radius},${170 + Math.sin(angle) * radius}`;
    })
    .join(" ");
  const labelPositions = [
    { x: 180, y: 24, anchor: "middle" },
    { x: 280, y: 82, anchor: "start" },
    { x: 280, y: 246, anchor: "start" },
    { x: 180, y: 324, anchor: "middle" },
    { x: 80, y: 246, anchor: "end" },
    { x: 80, y: 82, anchor: "end" },
  ] as const;

  return (
    <div className="analysis-radar-wrap">
      <svg className="analysis-radar compact" viewBox="0 0 360 340" role="img" aria-label="Driver strength profile">
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon
            className="radar-grid"
            key={scale}
            points={Array.from({ length: items.length }, (_, index) => {
              const angle = -Math.PI / 2 + (Math.PI * 2 * index) / items.length;
              const radius = 128 * scale;
              return `${180 + Math.cos(angle) * radius},${170 + Math.sin(angle) * radius}`;
            }).join(" ")}
          />
        ))}
        {items.map((_, index) => {
          const angle = -Math.PI / 2 + (Math.PI * 2 * index) / items.length;
          return <line className="radar-axis" key={index} x1="180" y1="170" x2={180 + Math.cos(angle) * 128} y2={170 + Math.sin(angle) * 128} />;
        })}
        <polygon className="radar-area" points={points} />
        <polyline className="radar-line" points={`${points} ${points.split(" ")[0]}`} />
        {items.map((item, index) => {
          const angle = -Math.PI / 2 + (Math.PI * 2 * index) / items.length;
          const cx = 180 + Math.cos(angle) * ((item.score / 100) * 128);
          const cy = 170 + Math.sin(angle) * ((item.score / 100) * 128);
          return (
            <circle
              className="radar-point"
              key={item.label}
              cx={cx}
              cy={cy}
              r="5"
              onMouseEnter={() => setTooltip({ label: item.label, score: item.score, x: cx, y: cy })}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
        {items.map((item, index) => {
          const lines = item.label.split(" ");
          return (
            <text className="radar-label" key={item.label} x={labelPositions[index].x} y={labelPositions[index].y} textAnchor={labelPositions[index].anchor}>
              <tspan x={labelPositions[index].x} dy="0">{lines.slice(0, Math.ceil(lines.length / 2)).join(" ")}</tspan>
              <tspan x={labelPositions[index].x} dy="1.15em">{lines.slice(Math.ceil(lines.length / 2)).join(" ")}</tspan>
            </text>
          );
        })}
      </svg>
      {tooltip ? (
        <div
          className="radar-tooltip"
          style={{ left: `${(tooltip.x / 360) * 100}%`, top: `${(tooltip.y / 340) * 100}%` }}
        >
          <strong>{tooltip.label}</strong>
          <span>Strength score: {Math.round(tooltip.score)}/100</span>
        </div>
      ) : null}
    </div>
  );
}

export function PredictionAnalysisDashboard({ constructors, drivers, race, response }: Props) {
  const summary = response.analysis_summary;
  const allDrivers = response.dashboard_analysis?.all_drivers?.drivers?.length
    ? response.dashboard_analysis.all_drivers.drivers
    : response.predictions;
  const dashboardDrivers = useMemo(() => {
    const predictionByDriver = new Map(response.predictions.map((driver) => [driver.driverId, driver]));

    return [...allDrivers]
      .map((driver) => {
        const prediction = predictionByDriver.get(driver.driverId);
        return {
          ...driver,
          analysis: driver.analysis ?? prediction?.analysis,
          dashboard_stats: driver.dashboard_stats ?? prediction?.analysis?.feature_groups,
          top_contributions: driver.top_contributions ?? prediction?.analysis?.top_contributions,
        };
      })
      .sort((a, b) => a.predicted_position - b.predicted_position);
  }, [allDrivers, response.predictions]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const selectedDriver = dashboardDrivers.find((driver) => driver.driverId === selectedDriverId) ?? dashboardDrivers[0];

  return (
    <section className="analysis-dashboard">
      <header className="analysis-topbar">
        <div>
          <p className="analysis-kicker">Prediction analysis</p>
          <h2>{race?.name ?? "Race"} <span>•</span> {formatDate(response.race_date ?? race?.date)}</h2>
          <p className="analysis-subline">
            Circuit: {response.circuit_id ?? race?.circuitId ?? "-"}
            {race?.circuit ? <> <span>•</span> {race.circuit.name.toUpperCase()}</> : null}
          </p>
        </div>
      </header>

      <main className="analysis-main-grid">
        <div className="analysis-left-column">
        <article className="analysis-card prediction-result-card">
          <div className="driver-picker-header">
            <h3>Driver analysis</h3>
            <label>
              Driver
              <select value={selectedDriver?.driverId ?? ""} onChange={(event) => setSelectedDriverId(Number(event.target.value))}>
                {dashboardDrivers.map((driver) => (
                  <option key={driver.driverId} value={driver.driverId}>
                    P{driver.predicted_position} - {driverName(driver.driverId, drivers)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedDriver ? (
            <>
              <div className="winner-detail" style={{ "--team-color": teamColor(selectedDriver, drivers) } as CSSProperties}>
                <div className="winner-position">
                  <span>{selectedDriver.predicted_position}</span>
                  <small>Predicted position</small>
                </div>
                <DriverAnalysisImage key={selectedDriver.driverId} driverId={selectedDriver.driverId} drivers={drivers} />
                <dl className="winner-meta">
                  <div><dt>Driver</dt><dd>{driverName(selectedDriver.driverId, drivers)}</dd></div>
                  <div><dt>Team</dt><dd>{teamName(selectedDriver, drivers, constructors)}</dd></div>
                  <div><dt>Model rank</dt><dd>P{selectedDriver.predicted_position}</dd></div>
                </dl>
                <div className="winner-score">
                  <span>Score</span>
                  <strong>{selectedDriver.score.toFixed(3)}</strong>
                  <small>Relative ranking value</small>
                </div>
              </div>

              <div className="analysis-mini-stats">
                <div><span>Grid</span><b>{formatValue(selectedDriver.dashboard_stats?.starting_position?.grid)}</b></div>
                <div><span>Qualifying</span><b>{formatValue(selectedDriver.dashboard_stats?.starting_position?.qualifying_position)}</b></div>
                <div><span>Gap to pole</span><b>{formatValue(selectedDriver.dashboard_stats?.starting_position?.qualifying_gap_to_pole_ms, "ms")}</b></div>
                <div><span>Driver points</span><b>{formatValue(selectedDriver.dashboard_stats?.driver_form?.driver_points_prev)}</b></div>
                <div><span>Driver wins</span><b>{formatValue(selectedDriver.dashboard_stats?.driver_form?.driver_wins_prev)}</b></div>
                <div><span>Circuit wins</span><b>{formatValue(selectedDriver.dashboard_stats?.driver_circuit_history?.driver_circuit_wins_hist)}</b></div>
              </div>
            </>
          ) : (
            <p>No driver data returned.</p>
          )}
        </article>

        <article className="analysis-card radar-card">
          <h3>Driver strengths on this circuit</h3>
          <div className="radar-legend">
            <span>{selectedDriver ? driverName(selectedDriver.driverId, drivers) : "Driver"}</span>
          </div>
          {selectedDriver ? <RadarChart driver={selectedDriver} /> : null}
        </article>
        </div>

        <div className="analysis-right-column">
        <article className="analysis-card contribution-card">
          <h3>Top model explanations</h3>
          <div className="contribution-list">
            {(selectedDriver?.top_contributions ?? []).map((item) => (
              <div className="contribution-row" key={item.feature}>
                <span title={item.feature}>{formatFeatureName(item.feature)}</span>
                <i className={item.direction === "down" ? "down" : "up"} style={{ width: `${Math.max(14, Math.min(100, item.abs_contribution * 210))}%` }} />
                <b>{item.contribution >= 0 ? "+" : ""}{item.contribution.toFixed(3)}</b>
                <em>{item.direction === "down" ? "↓" : "↑"}</em>
              </div>
            ))}
            {!selectedDriver?.top_contributions?.length ? <p>No contribution data returned.</p> : null}
          </div>
        </article>
        </div>
      </main>

      <section className="feature-groups-grid selected-driver-groups" aria-label="Selected driver feature groups">
        {groupEntries(selectedDriver?.dashboard_stats)
          .filter(([groupKey]) => groupKey !== "starting_position")
          .map(([groupKey, group]) => (
          <article className={`feature-analysis-card ${groupTone(groupKey)}`} key={groupKey}>
            <h3>{statGroupLabels[groupKey] ?? formatFeatureName(groupKey)}</h3>
            <dl>
              {Object.entries(group).slice(0, 6).map(([key, value]) => (
                <div key={key}>
                  <dt>{formatFeatureName(key)}</dt>
                  <dd>{formatValue(value, metricMode(key))}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </section>
    </section>
  );
}
