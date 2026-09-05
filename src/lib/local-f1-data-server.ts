import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type {
  Circuit,
  ConstructorOption,
  DriverOption,
  LocalF1Data,
  ParticipantRequest,
  Race,
  RaceApiDriver,
} from "@/lib/types";
import { getOpenF1Headers } from "@/lib/openf1-auth";

// The frontend lives beside the F1 project, not beside a top-level D:\F1 folder.
// Keep the environment override for deployments where the dataset is mounted elsewhere.
const csvRootCandidates = [
  process.env.F1_CSV_ROOT,
  path.resolve(process.cwd(), "F1", "CSVs"),
  path.resolve(process.cwd(), "..", "f1_rank_predict", "F1", "CSVs"),
  path.resolve(process.cwd(), "..", "F1", "CSVs"),
].filter((root): root is string => Boolean(root));

const csvRoot =
  csvRootCandidates.find((root) => existsSync(root)) ??
  path.resolve(process.cwd(), "F1", "CSVs");

const knownModernConstructorsById = new Map<number, string>([
  [1, "McLaren"],
  [3, "Williams"],
  [6, "Ferrari"],
  [9, "Red Bull"],
  [117, "Aston Martin"],
  [131, "Mercedes"],
  [210, "Haas F1 Team"],
  [214, "Alpine F1 Team"],
  [215, "RB F1 Team"],
  [216, "Cadillac F1 Team"],
  [217, "Audi"],
]);

type OpenF1Driver = {
  driver_number: number;
  full_name?: string;
  name_acronym?: string;
  team_name?: string;
  team_colour?: string;
  headshot_url?: string;
};

type OpenF1Session = {
  session_key: number;
  session_name?: string;
  date_start?: string;
};

type OpenF1Meeting = {
  circuit_image?: string;
  circuit_short_name?: string;
  country_name?: string;
  date_start?: string;
  meeting_name?: string;
  year?: number;
};

type JolpicaDriver = {
  driverId: string;
  permanentNumber?: string;
  givenName?: string;
  familyName?: string;
};

type JolpicaDriverInfo = {
  fullName: string;
  teamName: string | null;
};

const knownModernDriversByNumber = new Map<number, JolpicaDriverInfo>([
  [6, { fullName: "Isack Hadjar", teamName: "Red Bull" }],
]);

const knownModernHeadshotsByNumber = new Map<number, string>([
  [1, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png.transform/1col/image.png"],
  [3, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/1col/image.png"],
  [5, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GABBOR01_Gabriel_Bortoleto/gabbor01.png.transform/1col/image.png"],
  [10, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png.transform/1col/image.png"],
  [11, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png.transform/1col/image.png"],
  [12, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/K/ANDANT01_Kimi_Antonelli/andant01.png.transform/1col/image.png"],
  [14, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png.transform/1col/image.png"],
  [16, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png.transform/1col/image.png"],
  [18, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png.transform/1col/image.png"],
  [22, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png.transform/1col/image.png"],
  [23, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png.transform/1col/image.png"],
  [27, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png.transform/1col/image.png"],
  [30, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png.transform/1col/image.png"],
  [31, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png.transform/1col/image.png"],
  [41, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ARVLIN01_Arvid_Lindblad/arvlin01.png.transform/1col/image.png"],
  [43, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png.transform/1col/image.png"],
  [44, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/1col/image.png"],
  [55, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png.transform/1col/image.png"],
  [63, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/1col/image.png"],
  [77, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png.transform/1col/image.png"],
  [81, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png.transform/1col/image.png"],
  [87, "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png.transform/1col/image.png"],
]);

const knownModernDriversById = new Map<
  number,
  { name: string; constructorId: number; number: string }
>([
  [846, { name: "Lando Norris", constructorId: 1, number: "1" }],
  [857, { name: "Oscar Piastri", constructorId: 1, number: "81" }],
  [830, { name: "Max Verstappen", constructorId: 9, number: "3" }],
  [865, { name: "Isack Hadjar", constructorId: 9, number: "6" }],
  [863, { name: "Andrea Kimi Antonelli", constructorId: 131, number: "12" }],
  [847, { name: "George Russell", constructorId: 131, number: "63" }],
  [844, { name: "Charles Leclerc", constructorId: 6, number: "16" }],
  [1, { name: "Lewis Hamilton", constructorId: 6, number: "44" }],
  [859, { name: "Liam Lawson", constructorId: 215, number: "30" }],
  [866, { name: "Arvid Lindblad", constructorId: 215, number: "41" }],
  [807, { name: "Nico Hulkenberg", constructorId: 217, number: "27" }],
  [864, { name: "Gabriel Bortoleto", constructorId: 217, number: "5" }],
  [842, { name: "Pierre Gasly", constructorId: 214, number: "10" }],
  [861, { name: "Franco Colapinto", constructorId: 214, number: "43" }],
  [840, { name: "Lance Stroll", constructorId: 117, number: "18" }],
  [4, { name: "Fernando Alonso", constructorId: 117, number: "14" }],
  [839, { name: "Esteban Ocon", constructorId: 210, number: "31" }],
  [860, { name: "Oliver Bearman", constructorId: 210, number: "87" }],
  [848, { name: "Alexander Albon", constructorId: 3, number: "23" }],
  [832, { name: "Carlos Sainz", constructorId: 3, number: "55" }],
  [815, { name: "Sergio Perez", constructorId: 216, number: "11" }],
  [822, { name: "Valtteri Bottas", constructorId: 216, number: "77" }],
]);

function parseCsv(text: string) {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...values] = rows;
  return values.map((items) =>
    Object.fromEntries(headers.map((header, index) => [header, clean(items[index])])),
  );
}

function clean(value?: string) {
  if (!value || value === "\\N") return null;
  return value;
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readCsv(fileName: string) {
  const text = await readFile(path.join(csvRoot, fileName), "utf8");
  return parseCsv(text);
}

async function readOpenF1Drivers() {
  try {
    const response = await fetch(
      "https://api.openf1.org/v1/drivers?session_key=latest",
      {
        cache: "no-store",
        headers: getOpenF1Headers(),
        signal: AbortSignal.timeout(2500),
      },
    );
    if (!response.ok) return new Map<number, OpenF1Driver>();
    const drivers = (await response.json()) as OpenF1Driver[];
    return new Map(drivers.map((driver) => [driver.driver_number, driver]));
  } catch {
    return new Map<number, OpenF1Driver>();
  }
}

async function readOpenF1RaceDrivers(races: Race[]) {
  const output: Record<string, RaceApiDriver[]> = {};
  try {
    const years = Array.from(new Set(races.slice(0, 3).map((race) => race.year)));
    const sessions = (
      await Promise.all(years.map(async (year) => {
        const response = await fetch(`https://api.openf1.org/v1/sessions?year=${year}`, {
          cache: "no-store",
          headers: getOpenF1Headers(),
          signal: AbortSignal.timeout(2500),
        });
        return response.ok ? ((await response.json()) as OpenF1Session[]) : [];
      }))
    ).flat();

    for (const race of races.slice(0, 3)) {
      const session = sessions.find(
        (item) => item.session_name === "Race" && item.date_start?.slice(0, 10) === race.date,
      );
      if (!session) continue;
      const response = await fetch(
        `https://api.openf1.org/v1/drivers?session_key=${session.session_key}`,
        {
          cache: "no-store",
          headers: getOpenF1Headers(),
          signal: AbortSignal.timeout(2500),
        },
      );
      if (!response.ok) continue;
      const drivers = (await response.json()) as OpenF1Driver[];
      output[String(race.raceId)] = drivers
        .map((driver) => ({
          driverNumber: driver.driver_number,
          name: driver.full_name ?? `Driver ${driver.driver_number}`,
          teamName: driver.team_name ?? "Team unavailable",
        }))
        .sort((a, b) => a.driverNumber - b.driverNumber);
    }
  } catch {
    // OpenF1 is enrichment only; local CSV data remains the fallback.
  }
  return output;
}

function normalizeCircuitName(value?: string) {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

function normalizeCountryName(value?: string) {
  const country = normalizeCircuitName(value);
  if (["usa", "united states of america"].includes(country)) return "united states";
  if (["uae", "united arab emirates"].includes(country)) return "united arab emirates";
  return country;
}

function isMatchingOpenF1Meeting(race: Race, meeting: OpenF1Meeting) {
  const meetingName = normalizeCircuitName(meeting.meeting_name);
  const raceName = normalizeCircuitName(race.name);
  const circuitName = normalizeCircuitName(meeting.circuit_short_name);
  const raceCircuitName = normalizeCircuitName(race.circuit?.name);
  const countryName = normalizeCountryName(meeting.country_name);
  const raceCountry = normalizeCountryName(race.circuit?.country);

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

async function readOpenF1CircuitImages(races: Race[]) {
  const output = new Map<number, string>();
  const years = Array.from(new Set(races.map((race) => race.year)));
  const meetings = (await Promise.all(years.map(async (year) => {
    try {
      const response = await fetch(`https://api.openf1.org/v1/meetings?year=${year}`, {
        cache: "no-store",
        headers: getOpenF1Headers(),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok ? ((await response.json()) as OpenF1Meeting[]) : [];
    } catch {
      return [];
    }
  }))).flat();

  for (const race of races) {
    const meeting = meetings.find((item) => {
      if (!item.circuit_image) return false;
      return isMatchingOpenF1Meeting(race, item);
    });
    if (meeting?.circuit_image) output.set(race.raceId, meeting.circuit_image);
  }

  return output;
}

async function readJolpicaDriverInfo(year: number) {
  try {
    const response = await fetch(
      `https://api.jolpi.ca/ergast/f1/${year}/drivers.json?limit=100`,
      {
        headers: { "User-Agent": "F1MLPredicts/0.1.0 NextJS" },
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      },
    );
    if (!response.ok) return new Map<number, JolpicaDriverInfo>();

    const payload = await response.json();
    const drivers = (payload.MRData?.DriverTable?.Drivers ?? []) as JolpicaDriver[];

    return new Map(
      drivers
        .filter((driver) => Number.isFinite(Number(driver.permanentNumber)))
        .map((driver) => [
          Number(driver.permanentNumber),
          {
            fullName: `${driver.givenName ?? ""} ${driver.familyName ?? ""}`.trim(),
            teamName: knownModernDriversByNumber.get(Number(driver.permanentNumber))?.teamName ?? null,
          },
        ]),
    );
  } catch {
    return new Map<number, JolpicaDriverInfo>();
  }
}

async function readJolpicaRaceDrivers(races: Race[]) {
  const output: Record<string, RaceApiDriver[]> = {};
  await Promise.all(
    races.map(async (race) => {
      try {
        const response = await fetch(
          `https://api.jolpi.ca/ergast/f1/${race.year}/${race.round}/drivers.json?limit=100`,
          {
            headers: { "User-Agent": "F1MLPredicts/0.1.0 NextJS" },
            cache: "no-store",
            signal: AbortSignal.timeout(2500),
          },
        );
        if (!response.ok) return;
        const payload = await response.json();
        const drivers = payload?.MRData?.DriverTable?.Drivers ?? [];
        output[String(race.raceId)] = drivers.map((driver: {
          permanentNumber?: string;
          givenName?: string;
          familyName?: string;
        }) => ({
          driverNumber: Number(driver.permanentNumber ?? 0),
          name: `${driver.givenName ?? ""} ${driver.familyName ?? ""}`.trim(),
          teamName: "Team data available from race results",
        }));
      } catch {
        // A future round can legitimately have no participants published yet.
      }
    }),
  );
  return output;
}

async function buildLocalF1Data(): Promise<LocalF1Data> {
  const [raceRows, circuitRows, resultRows, qualifyingRows, openF1ByNumber] =
    await Promise.all([
      readCsv("races.csv"),
      readCsv("circuits.csv"),
      readCsv("results.csv"),
      readCsv("qualifying.csv"),
      readOpenF1Drivers(),
    ]);

  const today = new Date().toISOString().slice(0, 10);
  const circuits: Circuit[] = circuitRows.map((row) => ({
    circuitId: Number(row.circuitId),
    circuitRef: String(row.circuitRef),
    name: String(row.name),
    location: String(row.location),
    country: String(row.country),
  }));
  const circuitById = new Map(circuits.map((circuit) => [circuit.circuitId, circuit]));

  const races: Race[] = raceRows
    .map((row) => {
      const race: Race = {
        raceId: Number(row.raceId),
        year: Number(row.year),
        round: Number(row.round),
        circuitId: Number(row.circuitId),
        name: String(row.name),
        date: String(row.date),
        time: row.time ? String(row.time) : null,
        status: String(row.date) >= today ? "future" : "past",
        circuit: circuitById.get(Number(row.circuitId)),
      };
      return race;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const latestDatasetYear = Math.max(
    ...races.map((race) => race.year).filter(Number.isFinite),
  );
  const jolpicaByNumber = await readJolpicaDriverInfo(latestDatasetYear);
  const futureRaces = races.filter((race) => race.status === "future");
  // Future-race participant enrichment is not needed by the calendar or
  // prediction roster. Keeping it out of this request prevents slow third
  // party calls from making the /races page fail in a serverless deploy.
  const circuitImagesByRaceId = await readOpenF1CircuitImages(futureRaces);
  for (const race of futureRaces) {
    const circuitImageUrl = circuitImagesByRaceId.get(race.raceId) ?? null;
    race.circuitImageUrl = circuitImageUrl;
    race.circuitImageSource = circuitImageUrl ? "openf1" : null;
  }
  const raceApiDrivers = {};

  const latestRaceId = Math.max(
    ...resultRows.map((row) => Number(row.raceId)).filter(Number.isFinite),
  );
  const latestResults = resultRows.filter(
    (row) => Number(row.raceId) === latestRaceId,
  );
  const latestQualifyingByDriver = new Map(
    qualifyingRows
      .filter((row) => Number(row.raceId) === latestRaceId)
      .map((row) => [Number(row.driverId), row]),
  );

  const latestParticipants: ParticipantRequest[] = latestResults
    .map((row) => {
      const qualifying = latestQualifyingByDriver.get(Number(row.driverId));
      return {
        driverId: Number(row.driverId),
        constructorId: Number(row.constructorId),
        grid: numberOrNull(row.grid),
        qualifying_position: numberOrNull(qualifying?.position),
        q1: qualifying?.q1 ? String(qualifying.q1) : null,
        q2: qualifying?.q2 ? String(qualifying.q2) : null,
        q3: qualifying?.q3 ? String(qualifying.q3) : null,
      };
    })
    .sort((a, b) => (a.grid ?? 99) - (b.grid ?? 99));

  // Use the most recent completed race before each event. This keeps the
  // starting grid tied to the selected race instead of one global roster.
  const resultRaceIds = Array.from(
    new Set(resultRows.map((row) => Number(row.raceId)).filter(Number.isFinite)),
  );
  const raceById = new Map(races.map((race) => [race.raceId, race]));
  const participantsByRace: Record<string, ParticipantRequest[]> = {};
  for (const race of futureRaces) {
    const currentQualifyingRows = qualifyingRows.filter(
      (row) => Number(row.raceId) === race.raceId,
    );
    if (currentQualifyingRows.length > 0) {
      participantsByRace[String(race.raceId)] = currentQualifyingRows
        .map((row) => ({
          driverId: Number(row.driverId),
          constructorId: Number(row.constructorId),
          grid: numberOrNull(row.position),
          qualifying_position: numberOrNull(row.position),
          q1: row.q1 ? String(row.q1) : null,
          q2: row.q2 ? String(row.q2) : null,
          q3: row.q3 ? String(row.q3) : null,
        }))
        .sort((a, b) => (a.qualifying_position ?? 99) - (b.qualifying_position ?? 99));
      continue;
    }

    const previousRaceId = resultRaceIds
      .filter((raceId) => (raceById.get(raceId)?.date ?? "") < race.date)
      .sort((a, b) => (raceById.get(b)?.date ?? "").localeCompare(raceById.get(a)?.date ?? ""))[0];
    if (!previousRaceId) continue;
    const qualifyingByDriver = new Map(
      qualifyingRows
        .filter((row) => Number(row.raceId) === previousRaceId)
        .map((row) => [Number(row.driverId), row]),
    );
    participantsByRace[String(race.raceId)] = resultRows
      .filter((row) => Number(row.raceId) === previousRaceId)
      .map((row) => {
        const qualifying = qualifyingByDriver.get(Number(row.driverId));
        return {
          driverId: Number(row.driverId),
          constructorId: Number(row.constructorId),
          grid: numberOrNull(row.grid),
          qualifying_position: numberOrNull(qualifying?.position),
          q1: qualifying?.q1 ? String(qualifying.q1) : null,
          q2: qualifying?.q2 ? String(qualifying.q2) : null,
          q3: qualifying?.q3 ? String(qualifying.q3) : null,
        };
      })
      .sort((a, b) => (a.grid ?? 99) - (b.grid ?? 99));
  }

  const drivers: DriverOption[] = latestResults
    .map((row) => ({
      driverId: Number(row.driverId),
      number: row.number ? String(row.number) : null,
      constructorId: Number(row.constructorId),
      known: knownModernDriversById.get(Number(row.driverId)),
      openF1: row.number ? openF1ByNumber.get(Number(row.number)) : undefined,
      jolpica: row.number
        ? jolpicaByNumber.get(Number(row.number)) ??
          knownModernDriversByNumber.get(Number(row.number))
        : undefined,
    }))
    .map((driver) => {
      const name =
        driver.known?.name ??
        driver.jolpica?.fullName ??
        driver.openF1?.full_name ??
        `Piloto ${driver.driverId}`;
      const teamName =
        knownModernConstructorsById.get(driver.known?.constructorId ?? driver.constructorId) ??
        driver.jolpica?.teamName ??
        driver.openF1?.team_name ??
        `Equipo ${driver.constructorId}`;
      const number = driver.known?.number ?? driver.number;
      return {
        driverId: driver.driverId,
        number,
        constructorId: driver.known?.constructorId ?? driver.constructorId,
        name,
        teamName,
        teamColor: driver.openF1?.team_colour ?? null,
        headshotUrl:
          driver.openF1?.headshot_url ??
          knownModernHeadshotsByNumber.get(Number(number)) ??
          null,
        label: `${name}${number ? ` #${number}` : ""} - ${teamName}`,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const constructorNames = new Map<number, string>();
  for (const driver of drivers) {
    if (!constructorNames.has(driver.constructorId)) {
      constructorNames.set(
        driver.constructorId,
        knownModernConstructorsById.get(driver.constructorId) ?? driver.teamName,
      );
    }
  }

  const constructors: ConstructorOption[] = Array.from(
    new Set(drivers.map((driver) => driver.constructorId).filter(Number.isFinite)),
  )
    .sort((a, b) => a - b)
    .map((constructorId) => ({
      constructorId,
      name:
        constructorNames.get(constructorId) ??
        knownModernConstructorsById.get(constructorId) ??
        `Equipo ${constructorId}`,
      label:
        constructorNames.get(constructorId) ??
        knownModernConstructorsById.get(constructorId) ??
        `Equipo ${constructorId}`,
    }));

  const data: LocalF1Data = {
    races,
    circuits,
    drivers,
    constructors,
    latestParticipants,
    participantsByRace,
    raceApiDrivers,
  };

  return data;
}

export async function getLocalF1DataServer() {
  return buildLocalF1Data();
}
