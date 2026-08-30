import type { SavedPrediction } from "./types";
import { supabaseAuth } from "./supabase-auth";

type PredictionQuotaRequest = {
  race_id: number;
  simulation_count: number;
  source: "predicts" | "races";
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.detail ?? "No se pudo completar la operacion.");
  }
  return payload as T;
}

async function getAuthorizationHeaders(): Promise<Record<string, string>> {
  const session = await supabaseAuth?.auth.getSession();
  const accessToken = session?.data.session?.access_token;
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export async function checkPredictionQuota(payload: PredictionQuotaRequest) {
  const response = await fetch("/api/predictions/quota", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthorizationHeaders()),
    },
    body: JSON.stringify(payload),
  });

  return readJson<{
    allowed: boolean;
    detail?: string;
    is_premium: boolean;
    limit: number | null;
    remaining: number | null;
    used: number;
  }>(response);
}

export async function savePrediction(prediction: SavedPrediction) {
  const response = await fetch("/api/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthorizationHeaders()),
    },
    body: JSON.stringify({
      ...prediction,
      guest_id: window.localStorage.getItem("f1-ml-guest-id"),
    }),
  });

  if (response.status === 204) {
    const current = JSON.parse(
      window.localStorage.getItem("f1-ml-predictions") ?? "[]",
    ) as SavedPrediction[];
    window.localStorage.setItem(
      "f1-ml-predictions",
      JSON.stringify([prediction, ...current].slice(0, 100)),
    );
    return { mode: "local" as const };
  }

  return readJson<{ mode: "supabase" }>(response);
}

export async function loadSavedPredictions(): Promise<SavedPrediction[]> {
  const response = await fetch("/api/predictions", {
    cache: "no-store",
    headers: await getAuthorizationHeaders(),
  });

  if (response.status === 204) {
    return JSON.parse(
      window.localStorage.getItem("f1-ml-predictions") ?? "[]",
    ) as SavedPrediction[];
  }

  return readJson<SavedPrediction[]>(response);
}

export function ensureGuestId() {
  if (typeof window === "undefined") return null;
  const existing = window.localStorage.getItem("f1-ml-guest-id");
  if (existing) return existing;
  const guestId = crypto.randomUUID();
  window.localStorage.setItem("f1-ml-guest-id", guestId);
  return guestId;
}
