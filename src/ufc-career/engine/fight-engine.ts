import { createRng } from "./rng";
import { clamp } from "./effect-engine";
import { careerRoster } from "../data/roster";
import type { EventChoice, FightResult, FighterCareerState, FighterStats, FightingStyleId, Opponent } from "../types";

const firstNames = ["Dante", "Mateo", "Nikolai", "Rafael", "Kenji", "Marcus", "Andre", "Tariq", "Luca", "Ivan"];
const lastNames = ["Vega", "Stone", "Volkov", "Santos", "Reed", "Khan", "Costa", "Morales", "Hayes", "Nakamura"];
const styles: FightingStyleId[] = ["striker", "wrestler", "bjj", "kickboxer", "balanced"];
type FightImportance = NonNullable<EventChoice["fightImportance"]>;

function average(stats: FighterStats) {
  return Object.values(stats).reduce((sum, value) => sum + value, 0) / Object.values(stats).length;
}

function styleEdge(a: FightingStyleId, b: FightingStyleId) {
  if (a === "wrestler" && b === "striker") return 7;
  if (a === "bjj" && b === "wrestler") return 5;
  if (a === "striker" && b === "bjj") return 6;
  if (a === "kickboxer" && b === "balanced") return 4;
  if (a === "balanced") return 2;
  return -2;
}

function buildStatsFromBase(state: FighterCareerState, base: number, rng: ReturnType<typeof createRng>) {
  return Object.fromEntries(
    Object.keys(state.stats).map((key) => [key, clamp(base + rng.int(-9, 9), 25, 98)]),
  ) as FighterStats;
}

function buildRivalStats(state: FighterCareerState, rng: ReturnType<typeof createRng>) {
  const pressure = state.flags.isChampion ? 12 : state.ranking ? 8 : 5;
  return buildStatsFromBase(state, average(state.stats) + pressure + rng.int(-3, 7), rng);
}

function rivalOpponent(state: FighterCareerState, rng: ReturnType<typeof createRng>): Opponent | null {
  if (typeof state.flags.rivalName !== "string") return null;
  const style =
    typeof state.flags.rivalStyle === "string" && styles.includes(state.flags.rivalStyle as FightingStyleId)
      ? (state.flags.rivalStyle as FightingStyleId)
      : rng.pick(styles);
  return {
    age: clamp(state.age + rng.int(-3, 5), 22, 42),
    narrative: "Your established rival. The result moves reputation more than a normal fight.",
    name: state.flags.rivalName,
    ranking: state.ranking ? clamp(state.ranking + rng.int(-2, 3), 1, 12) : rng.int(5, 12),
    record: `${Math.max(1, state.record.wins + rng.int(-1, 5))}-${rng.int(1, Math.max(2, state.record.losses + 3))}`,
    stats: buildRivalStats(state, rng),
    style,
    weightClass: state.weightClass,
  };
}

function pickRosterOpponent(state: FighterCareerState, importance: FightImportance, salt: string) {
  const rng = createRng(`${state.careerSeed}-roster-${salt}-${state.season}`, state.rngStep);
  const pool = careerRoster
    .filter((fighter) => fighter.weightClass === state.weightClass)
    .filter((fighter) => {
      if (importance === "title") return fighter.ranking <= (state.flags.isChampion ? 5 : 2);
      if (importance === "eliminator") return fighter.ranking <= 6;
      if (importance === "superfight") return fighter.ranking <= 2;
      if (importance === "rivalry") return fighter.ranking <= 10;
      return fighter.ranking <= 12;
    });

  return pool.length ? rng.pick(pool) : null;
}

export function generateOpponent(
  state: FighterCareerState,
  importance: FightImportance = "normal",
  salt = "default",
): Opponent {
  const rng = createRng(`${state.careerSeed}-opponent-${salt}-${state.season}`, state.rngStep);
  const rivalry = importance === "rivalry" ? rivalOpponent(state, rng) : null;
  if (rivalry) return rivalry;
  const rosterOpponent = pickRosterOpponent(state, importance, salt);

  if (rosterOpponent) {
    const pressure =
      importance === "title" ? 15 : importance === "superfight" ? 18 : importance === "eliminator" ? 10 : 5;
    const base = average(state.stats) + pressure + rng.int(-4, 8);

    return {
      age: clamp(state.age + rng.int(-5, 7), 20, 42),
      imageUrl: rosterOpponent.imageUrl,
      name: rosterOpponent.name,
      narrative:
        importance === "title" && state.flags.isChampion
          ? "Mandatory challenger for your belt."
          : importance === "title"
            ? "Champion standing between you and the belt."
            : importance === "superfight"
              ? "Champion-level name from a bigger stage."
              : importance === "tournament"
                ? "Tournament bracket threat with a short turnaround."
                : "Ranked contender in your division.",
      nickname: rosterOpponent.nickname,
      ranking: rosterOpponent.ranking,
      record: rosterOpponent.record,
      stats: buildStatsFromBase(state, base, rng),
      style: rosterOpponent.style,
      weightClass: rosterOpponent.weightClass,
    };
  }

  const ranking =
    state.ranking === null
      ? state.record.wins > 5 && rng.next() > 0.55
        ? rng.int(11, 15)
        : null
      : Math.max(1, state.ranking + rng.int(-4, 5));
  const pressure = ranking ? 10 : 0;
  const base =
    average(state.stats) +
    rng.int(-8, 10) +
    pressure +
    (state.flags.isChampion ? 6 : 0) +
    (importance === "tournament" ? 5 : 0) -
    (state.flags.softMatchmaking ? 7 : 0);
  const opponentStyle = rng.pick(styles);

  return {
    age: clamp(state.age + rng.int(-4, 6), 18, 42),
    narrative: importance === "tournament" ? "Tournament replacement with no easy tape." : "Promotion-built opponent.",
    name: `${rng.pick(firstNames)} ${rng.pick(lastNames)}`,
    ranking,
    record: `${Math.max(0, state.record.wins + rng.int(-2, 8))}-${rng.int(0, Math.max(1, state.record.losses + 4))}`,
    stats: buildStatsFromBase(state, base, rng),
    style: opponentStyle,
    weightClass: state.weightClass,
  };
}

export function previewFight(state: FighterCareerState, importance: FightImportance = "normal", salt = "preview") {
  return generateOpponent(state, importance, salt);
}

function pickFinishMethod(state: FighterCareerState, rng: ReturnType<typeof createRng>) {
  const strikingScore =
    state.stats.power * 1.15 +
    state.stats.striking * 0.65 +
    state.stats.kicks * 0.35 +
    (state.fightingStyle === "striker" ? 28 : state.fightingStyle === "kickboxer" ? 22 : 0);
  const submissionScore =
    state.stats.submission * 1.35 +
    state.stats.grappling * 0.8 +
    state.stats.wrestling * 0.25 +
    (state.fightingStyle === "bjj" ? 42 : state.fightingStyle === "wrestler" ? 10 : 0);
  const topControlTkoScore =
    state.stats.wrestling * 0.65 +
    state.stats.strength * 0.45 +
    state.stats.grappling * 0.35 +
    (state.fightingStyle === "wrestler" ? 24 : 0);
  const total = strikingScore + submissionScore + topControlTkoScore;
  const roll = rng.next() * total;
  if (roll < submissionScore) return "SUBMISSION";
  return "KO/TKO";
}

export function simulateFight(
  state: FighterCareerState,
  importance: FightImportance = "normal",
  salt = "default",
  preparationBonus = 0,
): FightResult {
  const rng = createRng(`${state.careerSeed}-fight-${salt}-${state.season}-${state.record.wins}-${state.record.losses}`, state.rngStep);
  const opponent = generateOpponent(state, importance, salt);
  const fighterSkill = average(state.stats);
  const opponentSkill = average(opponent.stats);
  const ageMod = state.age <= 27 ? 4 : state.age <= 32 ? 6 : state.age <= 36 ? -4 : -10;
  const healthMod = (state.health - 70) / 2.4;
  const confidenceMod = (state.confidence - 50) / 4;
  const gamePlan = state.gamePlanBonus ?? 0;
  const importanceTax = importance === "title" || importance === "superfight" ? -4 : importance === "tournament" ? -2 : 0;
  const raw =
    50 +
    (fighterSkill - opponentSkill) * 1.15 +
    styleEdge(state.fightingStyle, opponent.style) +
    ageMod +
    healthMod +
    confidenceMod +
    gamePlan +
    preparationBonus +
    importanceTax;
  const winProbability = clamp(raw + rng.int(-8, 8), 8, 94);
  const roll = rng.next() * 100;
  const forcedWin = preparationBonus >= 50;
  const forcedLoss = preparationBonus <= -50;
  const draw = !forcedWin && !forcedLoss && !state.flags.isChampion && rng.next() < 0.018;
  const won = forcedWin || (!forcedLoss && !draw && roll <= winProbability);
  const finishSkill =
    Math.max(state.stats.power + state.stats.striking, state.stats.submission + state.stats.grappling, state.stats.wrestling + state.stats.strength) /
    220;
  const finishBias = finishSkill + preparationBonus / 180;
  const finished = rng.next() < clamp(finishBias * 100, 8, 72) / 100;
  const method = draw
    ? "DRAW"
    : finished
      ? pickFinishMethod(state, rng)
      : rng.next() > 0.72
        ? "SPLIT DECISION"
        : "DECISION";

  return { draw, method, opponent, round: finished ? rng.int(1, 4) : 5, winProbability, won };
}
