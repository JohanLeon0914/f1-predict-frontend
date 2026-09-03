"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CircuitSilhouette } from "@/components/CircuitSilhouette";
import { getLocalF1Data } from "@/lib/f1-ranker-api";
import type { AnalysisRecord } from "@/lib/analysis-content";
import type { LocalF1Data, Race } from "@/lib/types";

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusLabel(status: AnalysisRecord["status"]) {
  return status === "post-race" ? "Post-race" : "Pre-race";
}

function buildFallbackRaceForSilhouette(analysis: AnalysisRecord): Race {
  return {
    raceId: analysis.round,
    year: analysis.season,
    round: analysis.round,
    circuitId: analysis.round,
    name: analysis.raceName,
    date: analysis.date,
    time: null,
    status: analysis.status === "post-race" ? "past" : "future",
    circuitImageUrl: null,
    circuitImageSource: null,
    circuit: {
      circuitId: analysis.round,
      circuitRef: analysis.circuitRef,
      name: analysis.circuitName,
      location: analysis.country,
      country: analysis.country,
    },
  };
}

function findMatchingRace(data: LocalF1Data | null, analysis: AnalysisRecord) {
  if (!data) return buildFallbackRaceForSilhouette(analysis);

  return (
    data.races.find(
      (race) => race.year === analysis.season && race.name === analysis.raceName,
    ) ??
    data.races.find(
      (race) =>
        race.year === analysis.season &&
        race.date === analysis.date &&
        race.circuit?.circuitRef === analysis.circuitRef,
    ) ??
    data.races.find(
      (race) =>
        race.year === analysis.season && race.circuit?.circuitRef === analysis.circuitRef,
    ) ??
    buildFallbackRaceForSilhouette(analysis)
  );
}

function useLocalF1Data(initialData: LocalF1Data | null) {
  const [data, setData] = useState<LocalF1Data | null>(initialData);

  useEffect(() => {
    let mounted = true;
    getLocalF1Data({
      initialData,
      onUpdate: (localData) => {
        if (mounted) setData(localData);
      },
    })
      .then((localData) => {
        if (mounted) setData(localData);
      })
      .catch(() => {
        if (mounted) setData(null);
      });

    return () => {
      mounted = false;
    };
  }, [initialData]);

  return data;
}

type AnalysisRaceDataProps = {
  initialData?: LocalF1Data | null;
};

export function AnalysisCard({
  analysis,
  initialData = null,
}: { analysis: AnalysisRecord } & AnalysisRaceDataProps) {
  const localData = useLocalF1Data(initialData);
  const race = useMemo(() => findMatchingRace(localData, analysis), [analysis, localData]);

  return (
    <Link className="panel analysis-card" href={`/analysis/${analysis.slug}`}>
      <div className="analysis-card-top">
        <span className="analysis-pill">{statusLabel(analysis.status)}</span>
        <span className="analysis-date">{formatDate(analysis.date)}</span>
      </div>
      <div className="analysis-card-track" aria-hidden="true">
        <CircuitSilhouette className="analysis-card-silhouette" race={race} />
      </div>
      <h3>{analysis.raceName}</h3>
      <p>{analysis.summary}</p>
      <div className="analysis-card-meta">
        <span>{analysis.circuitName}</span>
        <span>Round {analysis.round}</span>
      </div>
      <span className="analysis-card-link">
        Read analysis <span>→</span>
      </span>
    </Link>
  );
}

export function AnalysisArticle({
  analysis,
  initialData = null,
}: { analysis: AnalysisRecord } & AnalysisRaceDataProps) {
  const localData = useLocalF1Data(initialData);
  const race = useMemo(() => findMatchingRace(localData, analysis), [analysis, localData]);
  const hasActualResults = analysis.predictionRows.some((row) => row.actualPosition != null);

  return (
    <article className="analysis-article">
      <header className="analysis-hero panel">
        <div className="analysis-hero-copy-block">
          <p className="tech-label">PUBLIC ANALYSIS</p>
          <h1>{analysis.raceName}</h1>
          <p className="analysis-hero-copy">{analysis.summary}</p>
          <div className="analysis-hero-meta">
            <div>
              <span>Race date</span>
              <b>{formatDate(analysis.date)}</b>
            </div>
            <div>
              <span>Circuit</span>
              <b>{analysis.circuitName}</b>
            </div>
            <div>
              <span>Status</span>
              <b>{statusLabel(analysis.status)}</b>
            </div>
          </div>
        </div>
        <div className="analysis-hero-visual" aria-hidden="true">
          <CircuitSilhouette className="analysis-hero-silhouette" race={race} />
          <div className="analysis-hero-visual-meta">
            <span>{analysis.circuitName}</span>
            <b>{analysis.country}</b>
          </div>
        </div>
      </header>

      <div className="analysis-detail-grid">
        <div className="analysis-main-column">
          <section className="analysis-section panel">
            <div className="section-heading analysis-section-heading">
              <div>
                <p className="tech-label">RACE OVERVIEW</p>
                <h2>What GRDX1 is looking at.</h2>
              </div>
            </div>
            <div className="analysis-overview-grid">
              <div>
                <span>Grand Prix</span>
                <b>{analysis.raceName}</b>
              </div>
              <div>
                <span>Circuit</span>
                <b>{analysis.circuitName}</b>
              </div>
              <div>
                <span>Country</span>
                <b>{analysis.country}</b>
              </div>
              <div>
                <span>Season</span>
                <b>{analysis.season}</b>
              </div>
            </div>
          </section>

          <section className="analysis-section panel">
            <div className="section-heading analysis-section-heading">
              <div>
                <p className="tech-label">GRDX1 PREDICTION</p>
                <h2>
                  {analysis.predictionRows.length
                    ? "Model-generated ranking."
                    : "Prediction will appear here after the model run."}
                </h2>
              </div>
            </div>
            {analysis.predictionRows.length ? (
              <div className="analysis-ranking-table">
                <div>
                  <span>Pos</span>
                  <span>Driver</span>
                  <span>Team</span>
                  <span>Note</span>
                </div>
                {analysis.predictionRows.map((row) => (
                  <div key={`${row.predictedPosition}-${row.driver}`}>
                    <strong>{row.predictedPosition}</strong>
                    <span>{row.driver}</span>
                    <span>{row.team}</span>
                    <span>{row.note ?? "GRDX1 model output"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="analysis-empty-state">
                <p>{analysis.publishedNote}</p>
                <p>
                  GRDX1 will only publish a ranking when the machine-learning run has real output.
                  The page is ready for that data, but it will not fill gaps with made-up results.
                </p>
              </div>
            )}
          </section>

          <section className="analysis-section panel">
            <div className="section-heading analysis-section-heading">
              <div>
                <p className="tech-label">MODEL ANALYSIS</p>
                <h2>Why the model leans this way.</h2>
              </div>
            </div>
            <div className="analysis-notes">
              {analysis.modelAnalysis.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </section>

          <section className="analysis-section panel">
            <div className="section-heading analysis-section-heading">
              <div>
                <p className="tech-label">PREDICTION VS ACTUAL RESULT</p>
                <h2>{hasActualResults ? "Model result check." : "Ready to update after the race."}</h2>
              </div>
            </div>
            {hasActualResults ? (
              <div className="analysis-result-table">
                <div>
                  <span>Predicted</span>
                  <span>Driver</span>
                  <span>Actual</span>
                  <span>Error</span>
                </div>
                {analysis.predictionRows.map((row) => (
                  <div key={`${row.predictedPosition}-${row.driver}`}>
                    <strong>{row.predictedPosition}</strong>
                    <span>{row.driver}</span>
                    <span>{row.actualPosition ?? "-"}</span>
                    <span>{row.positionError ?? "-"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="analysis-empty-state">
                <p>{analysis.resultSummary}</p>
                <p>
                  After the race, this same page can hold the actual finishing order, position
                  error, and a compact summary of how the model performed.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="analysis-sidebar" aria-label="Race analysis details">
          <section className="analysis-section panel analysis-track-panel">
            <p className="tech-label">CIRCUIT SHAPE</p>
            <CircuitSilhouette className="analysis-sidebar-silhouette" race={race} />
            <div>
              <h2>{analysis.circuitName}</h2>
              <p>{analysis.country}</p>
            </div>
          </section>

          <section className="analysis-section panel">
            <div className="section-heading analysis-section-heading">
              <div>
                <p className="tech-label">KEY FACTORS</p>
                <h2>The signals that matter most.</h2>
              </div>
            </div>
            <div className="analysis-factor-grid">
              {analysis.keyFactors.map((factor) => (
                <article key={factor.title}>
                  <span />
                  <h3>{factor.title}</h3>
                  <p>{factor.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="analysis-section panel analysis-status-note">
            <p className="tech-label">PAGE LIFECYCLE</p>
            <h2>It stays live after the race.</h2>
            <p>
              The analysis status changes from pre-race to post-race after the race date. The page
              remains public so it can be updated with the result comparison instead of disappearing.
            </p>
          </section>
        </aside>
      </div>
    </article>
  );
}
