import type { EventChoice, FighterCareerState, StatKey } from "../types";
import { baseStats } from "../data/styles";

const statKeys: StatKey[] = [
  "striking",
  "power",
  "wrestling",
  "grappling",
  "submission",
  "kicks",
  "takedownDefense",
  "cardio",
  "chin",
  "defense",
  "speed",
  "strength",
  "fightIq",
];

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function applyChoiceEffects(state: FighterCareerState, choice: EventChoice): FighterCareerState {
  const next: FighterCareerState = structuredClone(state);
  const effects = choice.effects ?? {};

  statKeys.forEach((key) => {
    if (effects[key] !== undefined) next.stats[key] = clamp((next.stats[key] ?? baseStats[key]) + effects[key]);
  });

  if (effects.health !== undefined) next.health = clamp(next.health + effects.health);
  if (effects.confidence !== undefined) next.confidence = clamp(next.confidence + effects.confidence);
  if (effects.popularity !== undefined) next.popularity = clamp(next.popularity + effects.popularity, 0, 999);
  if (effects.reputation !== undefined) next.reputation = clamp(next.reputation + effects.reputation);
  if (effects.pressure !== undefined) next.pressure = clamp(next.pressure + effects.pressure);
  if (effects.money !== undefined) next.money = Math.max(0, next.money + effects.money);
  if (effects.currentGym !== undefined) next.currentGym = effects.currentGym;
  if (effects.age !== undefined) next.age += effects.age;
  if (effects.defenses !== undefined) next.defenses = Math.max(0, next.defenses + effects.defenses);
  if (Object.prototype.hasOwnProperty.call(effects, "ranking")) {
    next.ranking = effects.ranking === null ? null : Math.max(1, Number(effects.ranking));
    if (next.ranking && (!next.peakRanking || next.ranking < next.peakRanking)) next.peakRanking = next.ranking;
  }
  if (effects.coachRelationship !== undefined) next.relationships.coach = clamp(next.relationships.coach + effects.coachRelationship);
  if (effects.fansRelationship !== undefined) next.relationships.fans = clamp(next.relationships.fans + effects.fansRelationship);
  if (effects.promotionRelationship !== undefined) {
    next.relationships.promotion = clamp(next.relationships.promotion + effects.promotionRelationship);
  }

  Object.entries(choice.flags ?? {}).forEach(([key, value]) => {
    next.flags[key] = value;
  });

  return next;
}
