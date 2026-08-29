"use client";

import { useEffect, useState } from "react";
import { getLocalF1Data } from "@/lib/f1-ranker-api";
import { ensureGuestId, loadSavedPredictions } from "@/lib/supabase";
import type { LocalF1Data, SavedPrediction } from "@/lib/types";

export function HistoryClient() {
  const [items, setItems] = useState<SavedPrediction[]>([]);
  const [data, setData] = useState<LocalF1Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureGuestId();
    Promise.all([loadSavedPredictions(), getLocalF1Data()])
      .then(([predictions, localData]) => {
        setItems(predictions);
        setData(localData);
      })
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : "History could not be loaded."),
      );
  }, []);

  function getDriverName(driverId: number) {
    return data?.drivers.find((driver) => driver.driverId === driverId)?.name ?? `Driver ${driverId}`;
  }

  return (
    <section className="page-shell mx-auto max-w-7xl px-4 pb-8">
      <div className="panel overflow-hidden">
        <div className="border-b border-slate-200 p-4">
          <h1 className="text-2xl font-semibold">History</h1>
          <p className="mt-1 text-sm text-slate-500">
            Guest simulations. When official results are available, this view can
            compare model accuracy against final positions.
          </p>
        </div>

        {error ? <p className="p-4 text-sm text-red-600">{error}</p> : null}

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Prediction date</th>
                <th>Race</th>
                <th>Simulaciones</th>
                <th>Predicted top 3</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.created_at).toLocaleString("es-CO")}</td>
                  <td>
                    <div className="font-medium">{item.race.name}</div>
                    <div className="text-xs text-slate-500">
                      Race ID {item.race.raceId} · {item.race.date}
                    </div>
                  </td>
                  <td>{item.simulation_count}</td>
                  <td>
                    {item.averaged_predictions
                      .slice(0, 3)
                      .map((prediction) => getDriverName(prediction.driverId))
                      .join(", ")}
                  </td>
                  <td className="text-slate-500">Waiting for official result</td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={5}>No saved predictions yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
