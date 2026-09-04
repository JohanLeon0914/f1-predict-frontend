import { supabaseAuth } from "./supabase-auth";

export type UfcFightPredictionQuotaRequest = {
  fight_key: string;
};

export type UfcFightPredictionQuotaResponse = {
  allowed: boolean;
  detail?: string;
  limit: number | null;
  remaining: number | null;
  used: number;
  is_premium: boolean;
};

export type SavedUfcPredictionPayload = {
  event_id?: string | null;
  event_name?: string | null;
  fight_id?: string | null;
  fight_key: string;
  fight_name?: string | null;
  prediction_payload: unknown;
  request_payload: unknown;
  source?: "ufc";
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

export function buildUfcFightKey({
  blueFighterId,
  eventId,
  fightId,
  fightDate,
  redFighterId,
  titleFight = false,
  weightClass,
}: {
  blueFighterId: string;
  eventId?: string | null;
  fightDate?: string | null;
  fightId?: string | null;
  redFighterId: string;
  titleFight?: boolean;
  weightClass?: string | null;
}) {
  if (eventId && fightId) return `event:${eventId}:${fightId}`;
  const [first, second] = [redFighterId, blueFighterId].sort();
  return `custom:${first}:${second}:${fightDate ?? ""}:${weightClass ?? ""}:${titleFight ? "1" : "0"}`;
}

export async function checkUfcPredictionQuota(payload: UfcFightPredictionQuotaRequest) {
  const response = await fetch("/api/ufc/predictions/quota", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthorizationHeaders()),
    },
    method: "POST",
  });

  return readJson<UfcFightPredictionQuotaResponse>(response);
}

export async function saveUfcPrediction(payload: SavedUfcPredictionPayload) {
  const response = await fetch("/api/ufc/predictions", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthorizationHeaders()),
    },
    method: "POST",
  });

  return readJson<{ mode: "supabase" }>(response);
}
