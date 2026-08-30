import type {
  ApiHealth,
  LocalF1Data,
  PredictionRequest,
  PredictionResponse,
} from "./types";

const LOCAL_DATA_CACHE_KEY = "f1-local-data-cache-v1";
const LOCAL_DATA_CACHE_TTL = 30 * 60 * 1000;
let localDataCache: LocalF1Data | null = null;
let localDataRequest: Promise<LocalF1Data> | null = null;

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
  return readJson<PredictionResponse>(
    await fetch("/api/ml/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function getLocalF1Data(): Promise<LocalF1Data> {
  if (localDataCache) return localDataCache;

  if (typeof window !== "undefined") {
    try {
      const cached = window.sessionStorage.getItem(LOCAL_DATA_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { timestamp?: number; data?: LocalF1Data };
        if (parsed.data && typeof parsed.timestamp === "number" && Date.now() - parsed.timestamp < LOCAL_DATA_CACHE_TTL) {
          localDataCache = parsed.data;
          return localDataCache;
        }
        window.sessionStorage.removeItem(LOCAL_DATA_CACHE_KEY);
      }
    } catch {
      // Storage can be unavailable in private browsing; use the request cache.
    }
  }

  if (localDataRequest) return localDataRequest;

  localDataRequest = fetch("/api/f1/local", { cache: "no-store" })
    .then((response) => readJson<LocalF1Data>(response))
    .then((data) => {
      localDataCache = data;
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(
            LOCAL_DATA_CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), data }),
          );
        } catch {
          // Memory cache still prevents duplicate requests for this page session.
        }
      }
      return data;
    })
    .finally(() => {
      localDataRequest = null;
    });

  return localDataRequest;
}
