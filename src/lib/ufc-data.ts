import { readFile } from "node:fs/promises";
import path from "node:path";
import { getFeaturedFighterPortraits, type FighterPortrait } from "@/lib/thesportsdb";

const DATASET_DIR = path.join(process.cwd(), "public", "UFC", "DATASETS");

export type UfcFighter = {
  dob: string | null;
  fighterId: string;
  height: string | null;
  name: string;
  nickname: string | null;
  reach: string | null;
  record: string;
  stance: string | null;
  stats: {
    sapm: string | null;
    slpm: string | null;
    strAcc: string | null;
    strDef: string | null;
    subAvg: string | null;
    tdAcc: string | null;
    tdAvg: string | null;
    tdDef: string | null;
  };
  weightLbs: string | null;
};

export type UfcFight = {
  blue: UfcFighter;
  blueRecord: string;
  fightId: string;
  red: UfcFighter;
  redRecord: string;
  titleFight: boolean;
  weightClass: string;
};

export type UfcDisplayEvent = {
  city: string;
  country: string;
  date: string;
  eventId: string;
  fights: UfcFight[];
  imageUrl?: string | null;
  location: string;
  name: string;
  shortName: string;
  status: "upcoming" | "recent";
  venue: string;
};

type CsvRow = Record<string, string>;

const upcomingEventSeeds: Array<{
  date: string;
  eventId: string;
  fights: Array<[string, string, string, boolean]>;
  location: string;
  name: string;
  shortName: string;
  venue: string;
}> = [
  {
    date: "2026-09-05",
    eventId: "2490782",
    fights: [
      ["Dan Hooker", "Salahdine Parnasse", "Lightweight", true],
      ["Benoit Saint Denis", "Rafael Fiziev", "Lightweight", false],
      ["Nassourdine Imavov", "Brendan Allen", "Middleweight", false],
      ["Manon Fiorot", "Erin Blanchfield", "Flyweight", false],
      ["Ciryl Gane", "Alexander Volkov", "Heavyweight", false],
    ],
    location: "Paris, France",
    name: "UFC Fight Night 287: Hooker vs. Parnasse",
    shortName: "UFC 287",
    venue: "Accor Arena",
  },
  {
    date: "2026-09-12",
    eventId: "ufc-fn-tybura-spivac-2",
    fights: [["Marcin Tybura", "Serghei Spivac", "Heavyweight", true]],
    location: "Prague, Czechia",
    name: "UFC Fight Night: Tybura vs. Spivac 2",
    shortName: "UFC Fight Night",
    venue: "O2 Arena",
  },
  {
    date: "2026-09-19",
    eventId: "ufc-288-omalley-dvalishvili",
    fights: [["Sean O'Malley", "Merab Dvalishvili", "Bantamweight", true]],
    location: "Las Vegas, USA",
    name: "UFC 288: O'Malley vs. Dvalishvili",
    shortName: "UFC 288",
    venue: "T-Mobile Arena",
  },
  {
    date: "2026-10-03",
    eventId: "ufc-fn-moreno-royval-3",
    fights: [["Brandon Moreno", "Brandon Royval", "Flyweight", true]],
    location: "Mexico City, Mexico",
    name: "UFC Fight Night: Moreno vs. Royval 3",
    shortName: "UFC Fight Night",
    venue: "Arena CDMX",
  },
  {
    date: "2026-10-20",
    eventId: "ufc-289-pereira-ankalaev-2",
    fights: [["Alex Pereira", "Magomed Ankalaev", "Light Heavyweight", true]],
    location: "Abu Dhabi, UAE",
    name: "UFC 289: Pereira vs. Ankalaev 2",
    shortName: "UFC 289",
    venue: "Etihad Arena",
  },
  {
    date: "2026-10-24",
    eventId: "ufc-fn-blanchfield-fiorot",
    fights: [["Erin Blanchfield", "Manon Fiorot", "Flyweight", true]],
    location: "Miami, USA",
    name: "UFC Fight Night: Blanchfield vs. Fiorot",
    shortName: "UFC Fight Night",
    venue: "Kaseya Center",
  },
] as const;

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (quoted && next === "\"") {
        field += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => value.length > 0)) rows.push(row);

  const [headers = [], ...data] = rows;
  return data.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

function value(raw: string | undefined) {
  const clean = raw?.trim();
  return clean ? clean : null;
}

function mapFighter(row: CsvRow): UfcFighter {
  return {
    dob: value(row.dob),
    fighterId: row.fighter_id,
    height: value(row.height),
    name: row.fighter_name,
    nickname: value(row.fighter_nick_name),
    reach: value(row.reach_inches),
    record: "0 - 0 - 0",
    stance: value(row.stance),
    stats: {
      sapm: value(row.sapm),
      slpm: value(row.slpm),
      strAcc: value(row.str_acc),
      strDef: value(row.str_def),
      subAvg: value(row.sub_avg),
      tdAcc: value(row.td_acc),
      tdAvg: value(row.td_avg),
      tdDef: value(row.td_def),
    },
    weightLbs: value(row.weight_lbs),
  };
}

function splitLocation(location: string) {
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    city: parts[0] ?? "",
    country: parts.at(-1) ?? "",
  };
}

function calculateRecords(fights: CsvRow[]) {
  const records = new Map<string, { draws: number; losses: number; wins: number }>();

  for (const fight of fights) {
    const red = fight.r_id;
    const blue = fight.b_id;
    if (!records.has(red)) records.set(red, { draws: 0, losses: 0, wins: 0 });
    if (!records.has(blue)) records.set(blue, { draws: 0, losses: 0, wins: 0 });

    if (fight.result_status === "draw") {
      records.get(red)!.draws += 1;
      records.get(blue)!.draws += 1;
    } else if (fight.winner_id === red) {
      records.get(red)!.wins += 1;
      records.get(blue)!.losses += 1;
    } else if (fight.winner_id === blue) {
      records.get(blue)!.wins += 1;
      records.get(red)!.losses += 1;
    }
  }

  return records;
}

function withRecord(fighter: UfcFighter, records: Map<string, { draws: number; losses: number; wins: number }>) {
  const record = records.get(fighter.fighterId);
  if (!record) return fighter;
  return { ...fighter, record: `${record.wins} - ${record.losses} - ${record.draws}` };
}

export async function getUfcFighters() {
  const [fighterText, fightText] = await Promise.all([
    readFile(path.join(DATASET_DIR, "fighter.csv"), "utf8"),
    readFile(path.join(DATASET_DIR, "fight.csv"), "utf8"),
  ]);
  const records = calculateRecords(parseCsv(fightText));

  return parseCsv(fighterText)
    .map(mapFighter)
    .filter((fighter) => fighter.name && fighter.fighterId)
    .map((fighter) => withRecord(fighter, records))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getUfcDisplayEvents(): Promise<UfcDisplayEvent[]> {
  const fighters = await getUfcFighters();
  const byName = new Map(fighters.map((fighter) => [fighter.name.toLowerCase(), fighter]));

  return upcomingEventSeeds.map((event) => {
    const { city, country } = splitLocation(event.location);
    const fights = event.fights
      .map(([redName, blueName, weightClass, titleFight], index) => {
        const red = byName.get(redName.toLowerCase());
        const blue = byName.get(blueName.toLowerCase());
        if (!red || !blue) return null;

        return {
          blue,
          blueRecord: blue.record,
          fightId: `${event.eventId}-${index + 1}`,
          red,
          redRecord: red.record,
          titleFight,
          weightClass,
        };
      })
      .filter((fight): fight is UfcFight => Boolean(fight));

    return {
      city,
      country,
      date: event.date,
      eventId: event.eventId,
      fights,
      location: event.location,
      name: event.name,
      shortName: event.shortName,
      status: "upcoming",
      venue: event.venue,
    };
  });
}

export async function getUfcDisplayEvent(eventId: string) {
  const events = await getUfcDisplayEvents();
  return events.find((event) => event.eventId === eventId) ?? null;
}

export async function getPortraitsForFighters(fighters: UfcFighter[]): Promise<Map<string, FighterPortrait>> {
  const allPortraits = await getFeaturedFighterPortraits(fighters.map((fighter) => fighter.name));
  return new Map(allPortraits.map((portrait) => [portrait.originalName.toLowerCase(), portrait]));
}
