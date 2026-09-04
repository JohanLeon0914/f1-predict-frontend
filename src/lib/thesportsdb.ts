const THESPORTSDB_BASE_URL = "https://www.thesportsdb.com/api/v1/json/123";
const UFC_LEAGUE_ID = "4443";

const imageFields = [
  "strCutout",
  "strThumb",
  "strRender",
  "strSquare",
  "strPoster",
  "strFanart1",
  "strFanart2",
  "strFanart3",
  "strFanart4",
] as const;

const licensePatterns = [
  /creative/i,
  /commons/i,
  /copyright/i,
  /attribution/i,
  /source/i,
  /author/i,
  /license/i,
  /licence/i,
];

const verifiedPortraitFallbacks: Record<string, { field: string; idPlayer: string; url: string }> = {
  "alex pereira": {
    field: "strCutout",
    idPlayer: "34145980",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/3a9h2j1728206945.png",
  },
  "alexander volkov": {
    field: "strCutout",
    idPlayer: "34145918",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/wb8icp1620591417.png",
  },
  "benoit saint denis": {
    field: "strCutout",
    idPlayer: "34254493",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/1cqvea1733497490.png",
  },
  "brandon moreno": {
    field: "strCutout",
    idPlayer: "34228401",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/5k6ozu1706006024.png",
  },
  "brandon royval": {
    field: "strCutout",
    idPlayer: "34254512",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/0k5sik1712737576.png",
  },
  "brendan allen": {
    field: "strCutout",
    idPlayer: "34254525",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/3o9gm81712753579.png",
  },
  "ciryl gane": {
    field: "strCutout",
    idPlayer: "34228396",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/t1q1211680086818.png",
  },
  "dan hooker": {
    field: "strCutout",
    idPlayer: "34254497",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/djm2rt1732795324.png",
  },
  "erin blanchfield": {
    field: "strCutout",
    idPlayer: "34254527",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/2q29ul1712742945.png",
  },
  "magomed ankalaev": {
    field: "strCutout",
    idPlayer: "34145928",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/hl8yyw1675769669.png",
  },
  "manon fiorot": {
    field: "strCutout",
    idPlayer: "34254513",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/svc9ln1712737961.png",
  },
  "marcin tybura": {
    field: "strCutout",
    idPlayer: "34254519",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/z1rhpz1711630135.png",
  },
  "merab dvalishvili": {
    field: "strCutout",
    idPlayer: "34228436",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/ecb6yk1726476068.png",
  },
  "nassourdine imavov": {
    field: "strCutout",
    idPlayer: "34254524",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/ho3t9t1707037656.png",
  },
  "rafael fiziev": {
    field: "strCutout",
    idPlayer: "34145959",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/st8keb1594817964.png",
  },
  "sean o'malley": {
    field: "strCutout",
    idPlayer: "34228440",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/cki55v1692640323.png",
  },
  "serghei spivac": {
    field: "strCutout",
    idPlayer: "34254520",
    url: "https://r2.thesportsdb.com/images/media/player/cutout/0wuoxf1732796991.png",
  },
};

export type UfcEvent = {
  city: string | null;
  country: string | null;
  date: string | null;
  description: string | null;
  id: string;
  imageUrl: string | null;
  league: string;
  name: string;
  round: string | null;
  status: "upcoming" | "recent";
  time: string | null;
  timestamp: string | null;
  venue: string | null;
};

export type FighterPortrait = {
  found: boolean;
  idPlayer: string | null;
  imageField: string | null;
  imageUrl: string | null;
  licenseMetadata: Record<string, string>;
  name: string;
  originalName: string;
  usablePortrait: boolean;
};

type SportsDbEvent = Record<string, string | null>;
type SportsDbPlayer = Record<string, string | null>;

const defaultFeaturedFighters = [
  "Ilia Topuria",
  "Alexander Volkanovski",
  "Islam Makhachev",
  "Charles Oliveira",
  "Max Holloway",
  "Alex Pereira",
] as const;

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, "_");
}

function pickImage(record: SportsDbEvent | SportsDbPlayer) {
  for (const field of imageFields) {
    const value = record[field];
    if (value) return { field, url: value };
  }

  return null;
}

function findLicenseMetadata(record: SportsDbPlayer) {
  return Object.fromEntries(
    Object.entries(record)
      .filter(([key, value]) => {
        if (!value) return false;
        return licensePatterns.some((pattern) => pattern.test(key) || pattern.test(value));
      })
      .map(([key, value]) => [key, String(value)]),
  );
}

function mapEvent(event: SportsDbEvent, status: UfcEvent["status"]): UfcEvent {
  const image = pickImage(event);

  return {
    city: event.strCity ?? null,
    country: event.strCountry ?? null,
    date: event.dateEvent ?? null,
    description: event.strDescriptionEN || null,
    id: event.idEvent ?? `${status}-${event.strEvent ?? "event"}`,
    imageUrl: image?.url ?? null,
    league: event.strLeague ?? "UFC",
    name: event.strEvent ?? "UFC event",
    round: event.intRound ?? null,
    status,
    time: event.strTimeLocal || event.strTime || null,
    timestamp: event.strTimestamp ?? null,
    venue: event.strVenue ?? null,
  };
}

async function readSportsDb<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${THESPORTSDB_BASE_URL}${path}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "GRDX1 sports analytics",
      },
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getUfcEvents() {
  const [nextPayload, pastPayload] = await Promise.all([
    readSportsDb<{ events: SportsDbEvent[] | null }>(`/eventsnextleague.php?id=${UFC_LEAGUE_ID}`),
    readSportsDb<{ events: SportsDbEvent[] | null }>(`/eventspastleague.php?id=${UFC_LEAGUE_ID}`),
  ]);

  const upcoming = nextPayload?.events?.map((event) => mapEvent(event, "upcoming")) ?? [];
  const recent = pastPayload?.events?.map((event) => mapEvent(event, "recent")) ?? [];

  return { recent, upcoming };
}

export async function getFeaturedFighterPortraits(
  fighters: readonly string[] = defaultFeaturedFighters,
): Promise<FighterPortrait[]> {
  const portraits = await Promise.all(
    fighters.map(async (originalName: string) => {
      const payload = await readSportsDb<{ player: SportsDbPlayer[] | null }>(
        `/searchplayers.php?p=${encodeURIComponent(normalizeName(originalName))}`,
      );
      const player = payload?.player?.[0] ?? null;
      const image = player ? pickImage(player) : null;
      const licenseMetadata = player ? findLicenseMetadata(player) : {};
      const fallback = verifiedPortraitFallbacks[originalName.toLowerCase()];

      return {
        found: Boolean(player ?? fallback),
        idPlayer: player?.idPlayer ?? fallback?.idPlayer ?? null,
        imageField: image?.field ?? fallback?.field ?? null,
        imageUrl: image?.url ?? fallback?.url ?? null,
        licenseMetadata,
        name: player?.strPlayer ?? originalName,
        originalName,
        usablePortrait: Boolean(
          (image && ["strCutout", "strThumb", "strRender"].includes(image.field)) ?? fallback,
        ),
      };
    }),
  );

  return portraits;
}
