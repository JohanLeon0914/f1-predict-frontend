import type { FighterStats, FightingStyleId } from "../types";

export const baseStats: FighterStats = {
  striking: 50,
  power: 50,
  wrestling: 50,
  grappling: 50,
  submission: 45,
  kicks: 50,
  takedownDefense: 50,
  cardio: 52,
  chin: 50,
  defense: 50,
  speed: 52,
  strength: 50,
  fightIq: 48,
};

export const fightingStyles: Record<FightingStyleId, { label: string; bonuses: Partial<FighterStats> }> = {
  striker: { label: "Striker", bonuses: { striking: 15, power: 10, grappling: -10 } },
  wrestler: { label: "Wrestler", bonuses: { wrestling: 15, cardio: 5, strength: 6, striking: -5 } },
  bjj: { label: "BJJ Specialist", bonuses: { grappling: 15, submission: 15, fightIq: 5, takedownDefense: -5 } },
  kickboxer: { label: "Kickboxer", bonuses: { striking: 10, kicks: 14, speed: 8, wrestling: -8 } },
  balanced: { label: "Balanced", bonuses: { defense: 6, cardio: 6, takedownDefense: 6, fightIq: 4 } },
};

export const weightClasses = [
  "Flyweight",
  "Bantamweight",
  "Featherweight",
  "Lightweight",
  "Welterweight",
  "Middleweight",
  "Light Heavyweight",
  "Heavyweight",
];
