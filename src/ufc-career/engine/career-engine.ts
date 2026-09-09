import { allCareerEvents } from "../data/events/career-events";
import { baseStats, fightingStyles, weightClasses } from "../data/styles";
import type { EventChoice, EventDefinition, FighterCareerState, FightingStyleId } from "../types";
import { applyChoiceEffects, clamp } from "./effect-engine";
import { selectCareerEvent } from "./event-engine";
import { simulateFight } from "./fight-engine";
import { getCareerStage, scoreCareer } from "./scoring";

const turnsPerYear = 5;
const effectPriority = [
  "striking",
  "power",
  "kicks",
  "wrestling",
  "grappling",
  "submission",
  "takedownDefense",
  "cardio",
  "chin",
  "defense",
  "speed",
  "strength",
  "fightIq",
  "money",
  "health",
  "confidence",
  "popularity",
  "reputation",
  "pressure",
  "coachRelationship",
  "fansRelationship",
  "promotionRelationship",
] as const;

export interface FighterSetup {
  name: string;
  nationality: string;
  age: number;
  weightClass: string;
  fightingStyle: FightingStyleId;
  careerSeed: string;
}

export function createInitialCareer(setup: FighterSetup): FighterCareerState {
  const style = fightingStyles[setup.fightingStyle];
  const stats = { ...baseStats };
  Object.entries(style.bonuses).forEach(([key, value]) => {
    stats[key as keyof typeof stats] = clamp(stats[key as keyof typeof stats] + (value ?? 0));
  });

  return {
    careerSeed: setup.careerSeed,
    rngStep: 0,
    name: setup.name || "Unknown Fighter",
    nationality: setup.nationality || "Independent",
    age: setup.age,
    season: 1,
    record: { wins: 0, losses: 0, draws: 0, koWins: 0, submissionWins: 0, decisionWins: 0 },
    stats,
    health: 100,
    confidence: 50,
    popularity: 0,
    reputation: 0,
    pressure: 0,
    money: 500,
    ranking: null,
    peakRanking: null,
    weightClass: setup.weightClass,
    currentGym: "Unsigned",
    fightingStyle: setup.fightingStyle,
    organization: "Regional",
    titles: [],
    defenses: 0,
    injuries: [],
    relationships: { coach: 50, fans: 20, promotion: 20 },
    flags: {},
    previousEvents: [],
    eventCooldowns: {},
    history: [
      {
        season: 1,
        age: setup.age,
        title: "CREATE YOUR FIGHTER",
        detail: `${style.label} from ${setup.nationality}.`,
        type: "milestone",
      },
    ],
    stage: "AMATEUR",
    retired: false,
  };
}

export function advanceWithoutEvent(state: FighterCareerState): FighterCareerState {
  const next = structuredClone(state);
  advanceCareerClock(next);
  next.health = clamp(next.health + 8);
  next.confidence = clamp(next.confidence + (next.record.losses > next.record.wins / 2 ? -2 : 2));
  next.stats.cardio = clamp(next.stats.cardio + (next.age < 28 ? 2 : next.age > 34 ? -2 : 0));
  next.stats.speed = clamp(next.stats.speed + (next.age > 33 ? -2 : 0));
  next.stage = getCareerStage(next);
  next.history.push({ season: next.season, age: next.age, title: "TRAINING BLOCK", detail: "Training, recovery, and small-room work.", type: "event" });
  return maybeForceRetirement(next);
}

function isBusinessDecision(event: EventDefinition, choice: EventChoice) {
  const text = `${event.id} ${event.title} ${choice.id} ${choice.label}`.toLowerCase();
  return (
    text.includes("gym") ||
    text.includes("sponsor") ||
    text.includes("brand") ||
    text.includes("contract") ||
    text.includes("management") ||
    text.includes("shop") ||
    text.includes("store") ||
    text.includes("supplement") ||
    text.includes("coach") ||
    text.includes("car") ||
    text.includes("yacht") ||
    text.includes("money") ||
    text.includes("purse") ||
    text.includes("deal")
  );
}

function isLifeDecision(event: EventDefinition, choice: EventChoice) {
  const text = `${event.id} ${event.title} ${choice.id} ${choice.label}`.toLowerCase();
  return (
    text.includes("life") ||
    text.includes("relationship") ||
    text.includes("wedding") ||
    text.includes("married") ||
    text.includes("marriage") ||
    text.includes("parent") ||
    text.includes("child") ||
    text.includes("newborn") ||
    text.includes("family") ||
    text.includes("divorce") ||
    text.includes("custody") ||
    text.includes("home") ||
    text.includes("tragedy")
  );
}

export function normalizeChoiceForEvent(event: EventDefinition, choice: EventChoice): EventChoice {
  const effects = choice.effects ?? {};
  const businessDecision = isBusinessDecision(event, choice);
  const lifeDecision = isLifeDecision(event, choice);
  const priority = businessDecision ? (["money", ...effectPriority.filter((key) => key !== "money")] as const) : effectPriority;
  const numericKeys = priority.filter((key) => typeof effects[key] === "number");
  const maxNumericEffects = businessDecision || lifeDecision || event.type === "career_defining" ? 3 : event.type === "negative" ? 2 : 1;
  const allowedNumericKeys = new Set(numericKeys.slice(0, maxNumericEffects));
  const nextEffects: EventChoice["effects"] = {};

  Object.entries(effects).forEach(([key, value]) => {
    if (typeof value === "number" && !allowedNumericKeys.has(key as (typeof effectPriority)[number])) return;
    nextEffects[key as keyof NonNullable<EventChoice["effects"]>] = value as never;
  });

  return { ...choice, effects: nextEffects };
}

function advanceCareerClock(state: FighterCareerState) {
  state.season += 1;
  if (state.season > 1 && (state.season - 1) % turnsPerYear === 0) state.age += 1;
}

function moveWeightClass(state: FighterCareerState, direction: "down" | "up") {
  const current = weightClasses.indexOf(state.weightClass);
  const nextIndex = direction === "up" ? current + 1 : current - 1;
  if (current === -1 || !weightClasses[nextIndex]) return;
  state.weightClass = weightClasses[nextIndex];
  state.ranking = null;
  if (!state.flags.isChampion) state.flags.isChampion = false;
  state.flags.titleReady = false;
  state.flags.changedDivision = true;
}

function applyFightOutcome(
  state: FighterCareerState,
  event: EventDefinition,
  choice: EventChoice,
  preparationBonus = 0,
): FighterCareerState {
  const result = simulateFight(state, choice.fightImportance ?? "normal", `${event.id}-${choice.id}`, preparationBonus);
  const next = structuredClone(state);
  const titleFight = choice.fightImportance === "title";
  const wasChampion = Boolean(state.flags.isChampion);
  const secondBeltFight = choice.id.includes("second_belt") || choice.id.includes("double");
  const tournamentFight = choice.fightImportance === "tournament";
  const totalFightsBefore = state.record.wins + state.record.losses + state.record.draws;
  const isRivalFight = state.flags.rivalName === result.opponent.name || choice.fightImportance === "rivalry";
  if (result.draw) {
    next.record.draws += 1;
    next.confidence = clamp(next.confidence - 2);
    next.reputation = clamp(next.reputation + (isRivalFight ? 2 : 1));
  } else if (result.won) {
    next.record.wins += 1;
    next.confidence = clamp(next.confidence + 8);
    const winStreak = [...next.history].reverse().filter((item) => item.type === "fight" && item.title.startsWith("WIN")).length + 1;
    next.reputation = clamp(next.reputation + (titleFight ? 14 : 4) + Math.min(4, winStreak) + (isRivalFight ? 10 : 0));
    next.popularity = clamp(next.popularity + (choice.fightImportance === "rivalry" ? 20 : 8), 0, 999);
    next.money += titleFight ? 500000 : next.organization === "Major" ? 70000 : 12000;
    if (result.method === "KO/TKO") next.record.koWins += 1;
    else if (result.method === "SUBMISSION") next.record.submissionWins += 1;
    else next.record.decisionWins += 1;
    if (choice.fightImportance === "eliminator") next.flags.titleReady = true;
    if (tournamentFight) next.flags.tournamentFinalReady = true;
    if (titleFight && wasChampion) {
      next.defenses += 1;
      next.flags.defenseCareerChoiceDue = true;
    }
    if (titleFight && !next.flags.isChampion) {
      next.flags.isChampion = true;
      next.ranking = 1;
      next.peakRanking = 1;
      next.titles.push(`${next.weightClass} World Champion`);
      next.flags.titleReady = false;
    } else if (secondBeltFight) {
      next.flags.doubleChampion = true;
      next.titles.push(`${next.weightClass} World Champion`);
      next.ranking = 1;
      next.peakRanking = 1;
    } else if (!next.flags.isChampion) {
      next.ranking = next.ranking ? Math.max(1, next.ranking - 3) : next.record.wins >= 5 ? 15 : null;
      if (next.ranking && next.ranking <= 5) next.flags.titleReady = true;
      if (next.ranking && (!next.peakRanking || next.ranking < next.peakRanking)) next.peakRanking = next.ranking;
    }
  } else {
    next.record.losses += 1;
    next.confidence = clamp(next.confidence - 10);
    next.reputation = clamp(next.reputation - (titleFight ? (wasChampion ? 30 : 24) : 10) - (isRivalFight ? 14 : 0));
    next.health = clamp(next.health - 12);
    next.ranking = next.ranking ? Math.min(15, next.ranking + 3) : null;
    if (tournamentFight) next.flags.tournamentFinalReady = false;
    if (titleFight && next.flags.isChampion) {
      next.flags.isChampion = false;
      next.history.push({ season: next.season, age: next.age, title: "LOST CHAMPIONSHIP", detail: "The belt changed hands.", type: "milestone" });
    }
  }
  next.health = clamp(next.health - (titleFight ? 10 : 6));
  if (isRivalFight && state.flags.rivalName === result.opponent.name) {
    next.flags.rivalMeetings = Number(next.flags.rivalMeetings ?? 1) + 1;
  } else if (!state.flags.rivalName && totalFightsBefore >= 2 && (choice.fightImportance === "rivalry" || titleFight || result.opponent.ranking || !result.won)) {
    next.flags.rivalName = result.opponent.name;
    next.flags.rivalStyle = result.opponent.style;
    next.flags.rivalMeetings = 1;
    next.history.push({
      season: next.season,
      age: next.age,
      title: "RIVALRY STARTED",
      detail: `${result.opponent.name} is now your main rival.`,
      type: "milestone",
    });
  }
  if (preparationBonus >= 10 && result.won) next.popularity = clamp(next.popularity + 8, 0, 999);
  if (preparationBonus <= -8 && !result.won) next.health = clamp(next.health - 8);
  next.history.push({
    season: next.season,
    age: next.age,
    title: `${result.won ? "WIN" : result.draw ? "DRAW" : "LOSS"} vs ${result.opponent.name}`,
    detail: `${result.method}${result.method === "DRAW" ? "" : ` R${result.round}`} (${result.opponent.record}, ${result.opponent.ranking ? `#${result.opponent.ranking}` : "unranked"}, ${Math.round(result.winProbability)}% win chance)`,
    type: "fight",
  });
  return next;
}

export function chooseEvent(
  state: FighterCareerState,
  event: EventDefinition,
  choice: EventChoice,
  preparationBonus = 0,
): FighterCareerState {
  const normalizedChoice = normalizeChoiceForEvent(event, choice);
  let next = applyChoiceEffects(state, normalizedChoice);
  if (normalizedChoice.flags?.clearDefenseChoice) next.flags.defenseCareerChoiceDue = false;
  if (normalizedChoice.flags?.moveWeightUp) moveWeightClass(next, "up");
  if (normalizedChoice.flags?.moveWeightDown) moveWeightClass(next, "down");
  if (normalizedChoice.flags?.vacateTitle) {
    next.flags.isChampion = false;
    next.flags.titleReady = false;
    next.flags.defenseCareerChoiceDue = false;
    next.ranking = null;
    next.history.push({ season: next.season, age: next.age, title: "VACATED CHAMPIONSHIP", detail: "You released the belt and reset your title path.", type: "milestone" });
  }
  next.previousEvents.push(event.id);
  if (event.cooldown) next.eventCooldowns[event.id] = next.season + event.cooldown;
  next.history.push({ season: next.season, age: next.age, title: event.title, detail: normalizedChoice.label, type: "event" });
  if (normalizedChoice.flags?.retireNow) return retireCareer(next);
  if (normalizedChoice.flags?.organizationMajor) next.organization = "Major";
  if (normalizedChoice.startsFight) next = applyFightOutcome(next, event, normalizedChoice, preparationBonus);
  advanceCareerClock(next);
  next.stage = getCareerStage(next);
  return maybeForceRetirement(next);
}

export function getNextEvent(state: FighterCareerState) {
  return selectCareerEvent(state, allCareerEvents);
}

export function retireCareer(state: FighterCareerState): FighterCareerState {
  const next = structuredClone(state);
  const legacy = scoreCareer(next);
  next.retired = true;
  next.legacyScore = legacy.legacyScore;
  next.legacyRank = legacy.legacyRank;
  next.history.push({ season: next.season, age: next.age, title: "RETIRED", detail: `${legacy.legacyRank} - Legacy ${legacy.legacyScore}`, type: "retirement" });
  return next;
}

function maybeForceRetirement(state: FighterCareerState) {
  const fights = state.record.wins + state.record.losses + state.record.draws;
  if (state.age >= 48 || (fights >= 50 && state.health <= 1) || (fights >= 62 && state.health <= 12)) return retireCareer(state);
  return state;
}
