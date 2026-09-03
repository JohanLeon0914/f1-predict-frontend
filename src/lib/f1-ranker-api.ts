import type {
  ApiHealth,
  LocalF1Data,
  PredictionRequest,
  PredictionResponse,
} from "./types";
import { supabaseAuth } from "./supabase-auth";

// v3 drops the old remote circuit-image associations, which could belong to
// a different meeting after a date/name match.
const LOCAL_DATA_CACHE_KEY = "f1-local-data-cache-v7";
const LOCAL_DATA_CACHE_TTL = 24 * 60 * 60 * 1000;
let localDataCache: LocalF1Data | null = null;
let localDataCacheTimestamp = 0;
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

function readStoredLocalF1Data() {
  if (typeof window === "undefined") return null;

  try {
    const cached = window.localStorage.getItem(LOCAL_DATA_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as { timestamp?: number; data?: LocalF1Data };
    if (!parsed.data || typeof parsed.timestamp !== "number") return null;
    return parsed as { timestamp: number; data: LocalF1Data };
  } catch {
    // Storage can be unavailable in private browsing; use the request cache.
    return null;
  }
}

function writeStoredLocalF1Data(data: LocalF1Data, timestamp = Date.now()) {
  localDataCache = data;
  localDataCacheTimestamp = timestamp;

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      LOCAL_DATA_CACHE_KEY,
      JSON.stringify({ timestamp, data }),
    );
  } catch {
    // Memory cache still prevents duplicate requests for this page session.
  }
}

function isFresh(timestamp: number) {
  return Date.now() - timestamp < LOCAL_DATA_CACHE_TTL;
}

function sameLocalF1Data(left: LocalF1Data | null, right: LocalF1Data) {
  return left ? JSON.stringify(left) === JSON.stringify(right) : false;
}

export function primeLocalF1Data(data: LocalF1Data) {
  writeStoredLocalF1Data(data);
}

async function refreshLocalF1Data(
  options: Pick<LocalF1DataOptions, "onUpdate"> = {},
): Promise<LocalF1Data> {
  const previous = localDataCache;

  if (localDataRequest) return localDataRequest;

  localDataRequest = fetch("/api/f1/local", { cache: "no-store" })
    .then((response) => readJson<LocalF1Data>(response))
    .then((data) => {
      writeStoredLocalF1Data(data);
      if (!sameLocalF1Data(previous, data)) options.onUpdate?.(data);
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
    writeStoredLocalF1Data(options.initialData);
    if (background) void refreshLocalF1Data(options).catch(() => null);
    return options.initialData;
  }

  if (localDataCache) {
    if (background && !isFresh(localDataCacheTimestamp)) {
      void refreshLocalF1Data(options).catch(() => null);
    }
    return localDataCache;
  }

  const stored = readStoredLocalF1Data();
  if (stored) {
    localDataCache = stored.data;
    localDataCacheTimestamp = stored.timestamp;

    if (isFresh(stored.timestamp)) return stored.data;
    if (background) {
      void refreshLocalF1Data(options).catch(() => null);
      return stored.data;
    }
  }

  return refreshLocalF1Data(options);
}
