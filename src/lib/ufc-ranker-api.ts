import { supabaseAuth } from "./supabase-auth";

export type UfcHealth = {
  status: string;
  missing_files?: string[];
};

export type UfcMetrics = {
  metrics?: Record<string, Record<string, number>>;
};

export type UfcPredictionRequest = {
  blue_fighter_id: string;
  fight_date?: string | null;
  red_fighter_id: string;
  title_fight?: boolean;
  weight_class?: string | null;
};

export type UfcPredictionResponse = {
  analysis?: {
    bias?: number;
    explanation_note?: string;
    global_feature_importance?: Array<{ feature: string; importance?: number; importance_pct?: number }>;
    top_contributions?: Array<{
      abs_contribution?: number;
      contribution?: number;
      direction?: string;
      feature: string;
    }>;
  };
  fight?: {
    fight_date?: string;
    title_fight?: boolean;
    weight_class?: string;
  };
  fighters?: {
    blue?: { fighter_id?: string; name?: string };
    red?: { fighter_id?: string; name?: string };
  };
  head_to_head?: Record<string, number>;
  prediction?: {
    blue_win_probability: number;
    confidence_pct: number;
    model_output_note?: string;
    red_win_probability: number;
    winner_fighter_id: string;
    winner_name: string;
    winner_side: "red" | "blue" | string;
  };
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = payload?.detail ?? payload?.error ?? "Unexpected error";
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail, null, 2));
  }

  return payload as T;
}

export async function getUfcHealth(): Promise<UfcHealth> {
  return readJson<UfcHealth>(await fetch("/api/ml/ufc/health", { cache: "no-store" }));
}

export async function getUfcMetrics(): Promise<UfcMetrics> {
  return readJson<UfcMetrics>(await fetch("/api/ml/ufc/metrics", { cache: "no-store" }));
}

export async function predictUfcFight(
  payload: UfcPredictionRequest,
): Promise<UfcPredictionResponse> {
  const session = await supabaseAuth?.auth.getSession();
  const accessToken = session?.data.session?.access_token;

  return readJson<UfcPredictionResponse>(
    await fetch("/api/ml/ufc/predict-fight", {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      method: "POST",
    }),
  );
}
