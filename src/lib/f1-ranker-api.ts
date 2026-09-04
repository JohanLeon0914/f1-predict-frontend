import type {
  ApiHealth,
  LocalF1Data,
  PredictionRequest,
  PredictionResponse,
} from "./types";
import { supabaseAuth } from "./supabase-auth";

let localDataRequest: Promise<LocalF1Data> | null = null;

type LocalF1DataOptions = {
  background?: boolean;
  initialData?: LocalF1Data | null;
  onUpdate?: (data: LocalF1Data) => void;
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = payload?.detail ?? payload?.error ?? "Error inesperado";
    const message =
      typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
    throw new Error(message);
  }

  return payload as T;
}

export async function getHealth(): Promise<ApiHealth> {
  return readJson<ApiHealth>(await fetch("/api/ml/health", { cache: "no-store" }));
}

export async function getMetrics(): Promise<Record<string, unknown>> {
  return readJson<Record<string, unknown>>(
    await fetch("/api/ml/metrics", { cache: "no-store" }),
  );
}

export async function predictRace(
  payload: PredictionRequest,
): Promise<PredictionResponse> {
  const session = await supabaseAuth?.auth.getSession();
  const accessToken = session?.data.session?.access_token;

  return readJson<PredictionResponse>(
    await fetch("/api/ml/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(payload),
    }),
  );
}

async function refreshLocalF1Data(
  options: Pick<LocalF1DataOptions, "onUpdate"> = {},
): Promise<LocalF1Data> {
  if (localDataRequest) return localDataRequest;

  localDataRequest = fetch("/api/f1/local", { cache: "no-store" })
    .then((response) => readJson<LocalF1Data>(response))
    .then((data) => {
      options.onUpdate?.(data);
      return data;
    })
    .finally(() => {
      localDataRequest = null;
    });

  return localDataRequest;
}

export async function getLocalF1Data(
  options: LocalF1DataOptions = {},
): Promise<LocalF1Data> {
  const background = options.background ?? true;

  if (options.initialData) {
    if (background) void refreshLocalF1Data(options).catch(() => null);
    return options.initialData;
  }

  return refreshLocalF1Data(options);
}
