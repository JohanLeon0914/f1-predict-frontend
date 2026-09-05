import type {
  ApiHealth,
  LocalF1Data,
  PredictionRequest,
  PredictionResponse,
  Race,
} from "./types";
import { supabaseAuth } from "./supabase-auth";

let localDataRequest: Promise<LocalF1Data> | null = null;

type LocalF1DataOptions = {
  background?: boolean;
  initialData?: LocalF1Data | null;
  onUpdate?: (data: LocalF1Data) => void;
};

type OpenF1Meeting = {
  circuit_image?: string;
  circuit_short_name?: string;
  country_name?: string;
  date_start?: string;
  meeting_name?: string;
  year?: number;
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

function normalizeOpenF1Name(value?: string | null) {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

function normalizeOpenF1Country(value?: string | null) {
  const country = normalizeOpenF1Name(value);
  if (["usa", "united states of america"].includes(country)) return "united states";
  if (["uae", "united arab emirates"].includes(country)) return "united arab emirates";
  return country;
}

function isMatchingOpenF1Meeting(race: Race, meeting: OpenF1Meeting) {
  const meetingName = normalizeOpenF1Name(meeting.meeting_name);
  const raceName = normalizeOpenF1Name(race.name);
  const circuitName = normalizeOpenF1Name(meeting.circuit_short_name);
  const raceCircuitName = normalizeOpenF1Name(race.circuit?.name);
  const countryName = normalizeOpenF1Country(meeting.country_name);
  const raceCountry = normalizeOpenF1Country(race.circuit?.country);

  const sameEvent =
    meetingName === raceName ||
    (meetingName.includes(raceName) && raceName.length > 4) ||
    (raceName.includes(meetingName) && meetingName.length > 4);
  const sameCircuit =
    circuitName === raceCircuitName ||
    (raceCircuitName.includes(circuitName) && circuitName.length > 4) ||
    (circuitName.includes(raceCircuitName) && raceCircuitName.length > 4);
  const sameCountry = !countryName || !raceCountry || countryName === raceCountry;
  const sameYear = !meeting.year || meeting.year === race.year;
  const sameDate = Boolean(meeting.date_start && meeting.date_start.slice(0, 10) === race.date);

  return sameCountry && sameYear && (sameDate || sameEvent || sameCircuit);
}

export async function getCircuitImagesForRaces(races: Race[]) {
  const racesMissingImages = races.filter((race) => !race.circuitImageUrl);
  if (!racesMissingImages.length) return new Map<number, string>();

  const years = Array.from(new Set(racesMissingImages.map((race) => race.year)));
  const meetings = (
    await Promise.all(
      years.map(async (year) => {
        const query = new URLSearchParams({
          resource: "meetings",
          year: String(year),
        });
        const response = await fetch(`/api/f1/openf1?${query}`, { cache: "no-store" });
        if (!response.ok) return [];
        return (await response.json()) as OpenF1Meeting[];
      }),
    )
  ).flat();

  const output = new Map<number, string>();
  for (const race of racesMissingImages) {
    const meeting = meetings.find(
      (item) => item.circuit_image && isMatchingOpenF1Meeting(race, item),
    );
    if (meeting?.circuit_image) output.set(race.raceId, meeting.circuit_image);
  }

  return output;
}
