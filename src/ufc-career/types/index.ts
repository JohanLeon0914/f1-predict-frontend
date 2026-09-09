export type FightingStyleId = "striker" | "wrestler" | "bjj" | "kickboxer" | "balanced";

export type CareerStage =
  | "AMATEUR"
  | "REGIONAL PROSPECT"
  | "PROFESSIONAL"
  | "RISING PROSPECT"
  | "RANKED CONTENDER"
  | "TOP 10"
  | "TOP 5"
  | "TITLE CONTENDER"
  | "CHAMPION"
  | "LEGEND";

export type Organization = "Amateur" | "Regional" | "Contender Series" | "Major" | "Global";
export type Sentiment = "positive" | "negative" | "neutral" | "opportunity" | "career_defining";
export type Operator = "==" | "!=" | ">=" | "<=" | ">" | "<" | "includes" | "excludes" | "exists";

export type StatKey =
  | "striking"
  | "power"
  | "wrestling"
  | "grappling"
  | "submission"
  | "kicks"
  | "takedownDefense"
  | "cardio"
  | "chin"
  | "defense"
  | "speed"
  | "strength"
  | "fightIq";

export type FighterStats = Record<StatKey, number>;

export type EventCondition =
  | { field: string; operator: Operator; value?: unknown }
  | { all: EventCondition[] }
  | { any: EventCondition[] }
  | { not: EventCondition };

export type EventEffects = Partial<Record<StatKey, number>> & {
  age?: number;
  health?: number;
  confidence?: number;
  popularity?: number;
  reputation?: number;
  money?: number;
  ranking?: number | null;
  currentGym?: string;
  defenses?: number;
  coachRelationship?: number;
  fansRelationship?: number;
  promotionRelationship?: number;
  pressure?: number;
  weightClassIndex?: number;
};

export interface EventChoice {
  id: string;
  label: string;
  detail?: string;
  effects?: EventEffects;
  flags?: Record<string, boolean | number | string>;
  nextEventId?: string;
  startsFight?: boolean;
  fightImportance?: "normal" | "eliminator" | "title" | "superfight" | "rivalry" | "tournament";
  fightNarrative?: string;
}

export interface EventDefinition {
  id: string;
  type: Sentiment;
  title: string;
  description: string;
  conditions?: EventCondition;
  probability?: number;
  weight?: number;
  cooldown?: number;
  chain?: { requiresEvent?: string; nextEventId?: string };
  choices: EventChoice[];
}

export interface InjuryDefinition {
  id: string;
  name: string;
  severity: "minor" | "moderate" | "major";
  duration: number;
  affectedStats: Partial<Record<StatKey, number>>;
  recoveryProbability: number;
  permanentPenalty: Partial<Record<StatKey, number>>;
}

export interface ActiveInjury extends InjuryDefinition {
  remaining: number;
}

export interface FighterCareerState {
  careerSeed: string;
  rngStep: number;
  name: string;
  nationality: string;
  age: number;
  season: number;
  record: {
    wins: number;
    losses: number;
    draws: number;
    koWins: number;
    submissionWins: number;
    decisionWins: number;
  };
  stats: FighterStats;
  health: number;
  confidence: number;
  popularity: number;
  reputation: number;
  pressure: number;
  money: number;
  ranking: number | null;
  peakRanking: number | null;
  weightClass: string;
  currentGym: string;
  fightingStyle: FightingStyleId;
  organization: Organization;
  titles: string[];
  defenses: number;
  injuries: ActiveInjury[];
  relationships: {
    coach: number;
    fans: number;
    promotion: number;
  };
  flags: Record<string, boolean | number | string>;
  previousEvents: string[];
  eventCooldowns: Record<string, number>;
  history: CareerHistoryItem[];
  stage: CareerStage;
  retired: boolean;
  campFocus?: string;
  gamePlanBonus?: number;
  legacyScore?: number;
  legacyRank?: string;
}

export interface CareerHistoryItem {
  season: number;
  age: number;
  title: string;
  detail: string;
  type: "event" | "fight" | "milestone" | "injury" | "retirement";
}

export interface Opponent {
  name: string;
  age: number;
  imageUrl?: string;
  narrative?: string;
  nickname?: string;
  record: string;
  style: FightingStyleId;
  stats: FighterStats;
  ranking: number | null;
  weightClass: string;
}

export interface FightResult {
  won: boolean;
  draw: boolean;
  method: "KO/TKO" | "SUBMISSION" | "DECISION" | "SPLIT DECISION" | "MAJORITY DECISION" | "DRAW";
  round: number;
  winProbability: number;
  opponent: Opponent;
}
