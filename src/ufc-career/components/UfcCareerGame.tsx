"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { allCareerEvents } from "../data/events/career-events";
import { baseStats, fightingStyles, weightClasses } from "../data/styles";
import { chooseEvent, createInitialCareer, getNextEvent, normalizeChoiceForEvent, retireCareer } from "../engine/career-engine";
import { previewFight } from "../engine/fight-engine";
import { dailyCareerSeed } from "../engine/rng";
import type { EventChoice, EventDefinition, FighterCareerState, FighterStats, FightingStyleId } from "../types";

const storageKey = "grdx1-road-to-glory-career";

function money(value: number) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

function record(state: FighterCareerState) {
  return `${state.record.wins}-${state.record.losses}-${state.record.draws}`;
}

function fightBadge(event: EventDefinition, choice: EventChoice) {
  if (choice.fightImportance === "title") return event.id === "title_defense" || choice.id.includes("defend") ? "TITLE DEFENSE" : "TITLE FIGHT";
  if (choice.fightImportance === "eliminator") return "TITLE ELIMINATOR";
  if (choice.fightImportance === "superfight") return "SUPERFIGHT";
  if (choice.fightImportance === "tournament") return "TOURNAMENT";
  if (choice.fightImportance === "rivalry") return "RIVALRY FIGHT";
  return "PRO FIGHT";
}

const statLabels: Record<keyof FighterStats, string> = {
  striking: "Striking",
  power: "Power",
  wrestling: "Wrestling",
  grappling: "Grappling",
  submission: "Submission",
  kicks: "Kicks",
  takedownDefense: "TD defense",
  cardio: "Cardio",
  chin: "Chin",
  defense: "Defense",
  speed: "Speed",
  strength: "Strength",
  fightIq: "Fight IQ",
};

const statKeys = Object.keys(statLabels) as (keyof FighterStats)[];
const nationalityOptions = ["Colombia", "United States", "Brazil", "Mexico", "Argentina", "Spain", "England", "Ireland", "Nigeria", "France", "Japan"];
const turnsPerCareerYear = 5;
const effectLabels: Record<string, string> = {
  health: "Health",
  confidence: "Confidence",
  popularity: "Popularity",
  reputation: "Reputation",
  money: "Money",
  coachRelationship: "Coach",
  fansRelationship: "Fans",
  promotionRelationship: "Promotion",
  pressure: "Pressure",
  currentGym: "Gym",
};

function careerYear(season: number) {
  return 2026 + Math.floor((season - 1) / turnsPerCareerYear);
}

function fightNeedsDrill(choice: EventChoice) {
  return Boolean(choice.startsFight);
}

type DrillMode = "circles" | "memory" | "timing" | "combo" | "reflex" | "defense" | "breathing" | "footwork" | "clinch";

const footworkCards = {
  "Step left": { image: "/UFC/career-footwork/step-left.png", alt: "MMA fighter stepping left with a yellow arrow", shortLabel: "LEFT" },
  "Step right": { image: "/UFC/career-footwork/step-right.png", alt: "MMA fighter stepping right with a yellow arrow", shortLabel: "RIGHT" },
  "Pivot out": { image: "/UFC/career-footwork/pivot-out.png", alt: "MMA fighter pivoting out with a curved yellow arrow", shortLabel: "PIVOT" },
  "Level change": { image: "/UFC/career-footwork/level-change.png", alt: "MMA fighter changing level with a downward yellow arrow", shortLabel: "LEVEL" },
  "Exit back": { image: "/UFC/career-footwork/exit-back.png", alt: "MMA fighter exiting backward with a yellow arrow", shortLabel: "EXIT" },
  "Cut angle": { image: "/UFC/career-footwork/cut-angle.png", alt: "MMA fighter cutting an angle with a diagonal yellow arrow", shortLabel: "ANGLE" },
} as const;

const comboActions = ["Jab", "Kick", "Shot", "Sprawl", "Clinch", "Exit"] as const;
const comboCards: Record<(typeof comboActions)[number], { image: string; alt: string }> = {
  Jab: { image: "/UFC/career-combo/jab.png", alt: "MMA fighter throwing a jab in the cage" },
  Kick: { image: "/UFC/career-combo/kick.png", alt: "MMA fighter landing a body kick in the cage" },
  Shot: { image: "/UFC/career-combo/shot.png", alt: "MMA fighter shooting a takedown in the cage" },
  Sprawl: { image: "/UFC/career-combo/sprawl.png", alt: "MMA fighter sprawling against a takedown" },
  Clinch: { image: "/UFC/career-combo/clinch.png", alt: "MMA fighters fighting for clinch position" },
  Exit: { image: "/UFC/career-combo/exit.png", alt: "MMA fighter exiting range after a strike" },
};

type DefenseMove = "rock" | "paper" | "scissors";
const defenseMoveSymbols: Record<DefenseMove, string> = { rock: "✊", paper: "✋", scissors: "✌" };
const defenseCounter: Record<DefenseMove, DefenseMove> = { rock: "paper", paper: "scissors", scissors: "rock" };

function drillConfig(choice: EventChoice, event: EventDefinition, state: FighterCareerState, forcedMode?: DrillMode | "") {
  const importance = choice.fightImportance;
  const fights = state.record.wins + state.record.losses + state.record.draws;
  const importanceDifficulty =
    importance === "superfight" ? 12 : importance === "title" ? 10 : importance === "tournament" ? 8 : importance === "eliminator" ? 6 : importance === "rivalry" ? 5 : 0;
  const careerDifficulty = Math.min(24, fights * 1.25 + (state.ranking ? 5 : 0) + (state.flags.isChampion ? 6 : 0) + importanceDifficulty);
  const modeRoll = seededNumber(`${state.careerSeed}-${event.id}-${choice.id}-drill`, state.season);
  const drillModes: DrillMode[] = ["memory", "timing", "circles", "combo", "reflex", "defense", "breathing", "footwork", "clinch"];
  const mode = forcedMode || drillModes[Math.floor(modeRoll * drillModes.length)] || "circles";
  const zone = Math.max(14, Math.round(28 - careerDifficulty * 0.45));
  const speedPenalty = careerDifficulty * 14;
  const actionTime = Math.max(2200, Math.round(4000 - careerDifficulty * 55));
  if (importance === "superfight") return { label: "Legacy pressure", mode, par: Math.min(90, 78 + careerDifficulty), size: 24, speed: Math.max(660, 900 - speedPenalty), targets: 14, zone, actionTime };
  if (importance === "title") return { label: "Championship rounds", mode, par: Math.min(88, 72 + careerDifficulty), size: 28, speed: Math.max(760, 1040 - speedPenalty), targets: 12, zone, actionTime };
  if (importance === "tournament") return { label: "Short-turnaround bracket", mode, par: Math.min(86, 68 + careerDifficulty), size: 30, speed: Math.max(820, 1120 - speedPenalty), targets: 11, zone, actionTime };
  if (importance === "eliminator") return { label: "Contender pace", mode, par: Math.min(84, 64 + careerDifficulty), size: 34, speed: Math.max(920, 1260 - speedPenalty), targets: 10, zone, actionTime };
  if (importance === "rivalry") return { label: "Rivalry chaos", mode, par: Math.min(82, 62 + careerDifficulty), size: 36, speed: Math.max(980, 1320 - speedPenalty), targets: 9, zone, actionTime };
  return { label: "Fight camp execution", mode, par: Math.min(80, 56 + careerDifficulty), size: 40, speed: Math.max(1040, 1460 - speedPenalty), targets: 8, zone, actionTime };
}

function seededNumber(seed: string, index: number) {
  let hash = 2166136261;
  const input = `${seed}-${index}`;
  for (let cursor = 0; cursor < input.length; cursor += 1) {
    hash ^= input.charCodeAt(cursor);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function spacedDrillTargets(seed: string, count: number) {
  const cells = Array.from({ length: 20 }, (_, index) => {
    const column = index % 5;
    const row = Math.floor(index / 5);
    return {
      left: 12 + column * 19 + seededNumber(seed, index * 2) * 6,
      top: 14 + row * 21 + seededNumber(seed, index * 2 + 1) * 7,
    };
  }).sort((left, right) => seededNumber(seed, left.left + left.top) - seededNumber(seed, right.left + right.top));

  const targets: { left: number; top: number }[] = [];
  for (let index = 0; index < count; index += 1) {
    const previous = targets[targets.length - 1];
    const minDistance = 34;
    const candidate =
      cells.find((cell) => {
        if (!previous) return true;
        const distance = Math.hypot(cell.left - previous.left, cell.top - previous.top);
        return distance >= minDistance;
      }) ??
      [...cells].sort((left, right) => {
        if (!previous) return 0;
        return Math.hypot(right.left - previous.left, right.top - previous.top) - Math.hypot(left.left - previous.left, left.top - previous.top);
      })[0];

    if (!candidate) break;
    targets.push(candidate);
    cells.splice(cells.indexOf(candidate), 1);
    if (!cells.length) {
      cells.push(...targets.slice(0, -1).sort((left, right) => seededNumber(`${seed}-recycle-${index}`, left.left + left.top) - seededNumber(`${seed}-recycle-${index}`, right.left + right.top)));
    }
  }
  return targets;
}

function nonRepeatingSequence<T>(items: T[], seed: string, count: number) {
  const sequence: T[] = [];
  const usage = new Map<T, number>(items.map((item) => [item, 0]));
  for (let index = 0; index < count; index += 1) {
    const leastUsed = Math.min(...items.filter((item) => item !== sequence[sequence.length - 1]).map((item) => usage.get(item) ?? 0));
    const pool = items.filter((item) => item !== sequence[sequence.length - 1] && (usage.get(item) ?? 0) === leastUsed);
    const item = pool[Math.floor(seededNumber(seed, index) * pool.length)] ?? items[index % items.length] ?? items[0];
    sequence.push(item);
    usage.set(item, (usage.get(item) ?? 0) + 1);
  }
  return sequence;
}

function drillPasses(mode: DrillMode, score: number, par: number) {
  if (mode === "circles") return score > 50;
  if (mode === "memory" || mode === "combo" || mode === "defense" || mode === "footwork") return score >= 66;
  if (mode === "clinch") return score >= 70;
  return score >= par;
}

function fallbackEvent(state: FighterCareerState): EventDefinition {
  const variants: EventDefinition[] = [
    {
      id: "fallback_training",
      type: "neutral",
      title: "TRAINING CHOICE",
      description: "No fight is booked this month. Pick one area and move the career forward.",
      choices: [
        { id: "boxing", label: "Boxing rounds", detail: "Sharper hands.", effects: { striking: 3 } },
        { id: "kicks", label: "Kick lab", detail: "More weapons at range.", effects: { kicks: 3 } },
        { id: "grappling", label: "Grappling room", detail: "Better control on the mat.", effects: { grappling: 3 } },
      ],
    },
    {
      id: "fallback_body",
      type: "neutral",
      title: "BODY MAINTENANCE",
      description: "Your team gives you a quiet week. Choose what matters most before the next call.",
      choices: [
        { id: "cardio", label: "Conditioning block", detail: "Build the gas tank.", effects: { cardio: 3 } },
        { id: "strength", label: "Strength room", detail: "More clinch force.", effects: { strength: 3 } },
        { id: "recovery", label: "Recovery work", detail: "Get fresher.", effects: { health: 8 } },
      ],
    },
    {
      id: "fallback_business",
      type: "opportunity",
      title: "LOCAL BRAND CALLS",
      description: "A sponsor wants your name before you are famous. The money helps, but every deal shapes the image.",
      choices: [
        { id: "supplement_brand", label: "Supplement sponsor", detail: "Bigger cash, more media pressure.", effects: { money: 6500, popularity: 3, cardio: -2 } },
        { id: "fightwear_brand", label: "Fightwear sponsor", detail: "Cleaner fit, lower payout.", effects: { money: 3500, reputation: 3, fansRelationship: 2 } },
        { id: "skip_brand", label: "Skip the deal", detail: "No money, no distractions.", effects: { confidence: 3 } },
      ],
    },
    {
      id: "fallback_gym_offer",
      type: "opportunity",
      title: "GYM WANTS TO SIGN YOU",
      description: "A bigger room offers a training contract. Better access usually comes with strings.",
      choices: [
        { id: "pressure_room", label: "Pressure Room MMA", detail: "Hard rounds and a small stipend.", effects: { currentGym: "Pressure Room MMA", money: 2200, wrestling: 4, health: -4 } },
        { id: "apex_striking", label: "Apex Striking Lab", detail: "Cleaner standup, higher fees.", effects: { currentGym: "Apex Striking Lab", kicks: 4, money: -1800 } },
        { id: "stay_current", label: "Stay with current team", detail: "Keep trust in the room.", effects: { coachRelationship: 4 } },
      ],
    },
  ];
  const index = Math.floor(seededNumber(`${state.careerSeed}-fallback`, state.season + state.rngStep) * variants.length);
  return variants[index] ?? variants[0];
}

function shopEvent(state: FighterCareerState): EventDefinition {
  const shopChoices: EventChoice[] = [
    { id: "supplements", label: "Supplements pack", detail: "$2K. Better recovery without headlines.", effects: { money: -2000, health: 8, cardio: 2 }, flags: { boughtSupplements: true } },
    { id: "private_coach", label: "Private coach", detail: "$12K. One-on-one technical jump.", effects: { money: -12000, fightIq: 5, coachRelationship: 3 }, flags: { hiredPrivateCoach: true } },
    { id: "sports_car", label: "Sports car", detail: "$90K. Image up, focus questioned.", effects: { money: -90000, reputation: 7, cardio: -2 }, flags: { boughtSportsCar: true } },
    { id: "yacht_weekend", label: "Yacht weekend", detail: "$450K. Massive fame flex, awful camp signal.", effects: { money: -450000, reputation: 12, cardio: -5 }, flags: { boughtYacht: true } },
  ];
  const choices = shopChoices.filter((choice) => state.money + ((choice.effects?.money as number | undefined) ?? 0) >= 0);

  return {
    id: "career_shop",
    type: "opportunity",
    title: "FIGHTER SHOP",
    description: "Spend career money on your body, your team, or your image. Some purchases help performance, others boost reputation at a cost.",
    choices: choices.length ? choices : [{ id: "leave_shop", label: "Leave shop", detail: "No affordable upgrades right now.", effects: { confidence: 1 } }],
  };
}

const minigameLabModes: DrillMode[] = ["memory", "timing", "circles", "combo", "reflex", "defense", "breathing", "footwork", "clinch"];
type MinigameLabDifficulty = "prospect" | "professional" | "ranked" | "champion" | "legend";
const minigameLabDifficulties: { id: MinigameLabDifficulty; label: string; detail: string }[] = [
  { id: "prospect", label: "Prospect", detail: "Early career timing" },
  { id: "professional", label: "Professional", detail: "Active regional pace" },
  { id: "ranked", label: "Ranked", detail: "Contender pressure" },
  { id: "champion", label: "Champion", detail: "Title-fight pace" },
  { id: "legend", label: "Legend", detail: "Late-career chaos" },
];
const minigameLabEvent: EventDefinition = {
  id: "minigame_lab_event",
  type: "neutral",
  title: "MINIGAME LAB",
  description: "Test fight-camp drills directly.",
  choices: [
    {
      id: "minigame_lab_fight",
      label: "Run drill",
      detail: "Direct minigame test.",
      startsFight: true,
      fightImportance: "normal",
    },
  ],
};
const minigameLabChoice = minigameLabEvent.choices[0];

function createMinigameLabCareer(difficulty: MinigameLabDifficulty = "prospect") {
  const career = createInitialCareer({
    age: 24,
    careerSeed: `minigame-lab-${difficulty}`,
    fightingStyle: "balanced",
    name: "Test Fighter",
    nationality: "Colombia",
    weightClass: "Lightweight",
  });
  if (difficulty === "professional") {
    return { ...career, age: 26, organization: "Major" as const, record: { ...career.record, wins: 6, losses: 1 }, season: 8, stage: "PROFESSIONAL" as const };
  }
  if (difficulty === "ranked") {
    return { ...career, age: 28, organization: "Major" as const, ranking: 9, record: { ...career.record, wins: 12, losses: 2, koWins: 5, submissionWins: 3 }, season: 16, stage: "TOP 10" as const };
  }
  if (difficulty === "champion") {
    return {
      ...career,
      age: 30,
      defenses: 1,
      flags: { ...career.flags, isChampion: true },
      organization: "Major" as const,
      ranking: 1,
      record: { ...career.record, wins: 18, losses: 2, koWins: 8, submissionWins: 5 },
      season: 24,
      stage: "CHAMPION" as const,
      titles: ["World Lightweight Championship"],
    };
  }
  if (difficulty === "legend") {
    return {
      ...career,
      age: 34,
      defenses: 5,
      flags: { ...career.flags, isChampion: true },
      organization: "Global" as const,
      ranking: 1,
      record: { ...career.record, wins: 24, losses: 3, koWins: 12, submissionWins: 6 },
      season: 36,
      stage: "LEGEND" as const,
      titles: ["World Lightweight Championship", "Superfight Champion"],
    };
  }
  return career;
}

export function UfcCareerGame({ debug = false, minigameLab = false }: { debug?: boolean; minigameLab?: boolean }) {
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("Colombia");
  const [age, setAge] = useState(20);
  const [weightClass, setWeightClass] = useState("Lightweight");
  const [fightingStyle, setFightingStyle] = useState<FightingStyleId>("balanced");
  const [careerSeed, setCareerSeed] = useState(dailyCareerSeed());
  const [labDifficulty, setLabDifficulty] = useState<MinigameLabDifficulty>("prospect");
  const [state, setState] = useState<FighterCareerState | null>(() => (minigameLab ? createMinigameLabCareer("prospect") : null));
  const [forcedEventId, setForcedEventId] = useState("");
  const [forcedDrillMode, setForcedDrillMode] = useState<DrillMode | "">("");
  const [shopOpen, setShopOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingFight, setPendingFight] = useState<{ choice: EventChoice; event: EventDefinition } | null>(null);
  const [drillHits, setDrillHits] = useState(0);
  const [drillMisses, setDrillMisses] = useState(0);
  const [drillStarted, setDrillStarted] = useState(false);
  const [memoryRevealed, setMemoryRevealed] = useState(false);
  const [memoryPicked, setMemoryPicked] = useState<number[]>([]);
  const [memoryWrong, setMemoryWrong] = useState<number[]>([]);
  const [resultNotice, setResultNotice] = useState<{ detail: string; title: string } | null>(null);
  const [targetIndex, setTargetIndex] = useState(0);
  const [timingStart, setTimingStart] = useState(0);
  const [timingScore, setTimingScore] = useState<number | null>(null);
  const [timingCursor, setTimingCursor] = useState<number | null>(null);
  const [reflexReady, setReflexReady] = useState(false);
  const [reflexStartedAt, setReflexStartedAt] = useState(0);
  const [reflexActivePad, setReflexActivePad] = useState<number | null>(null);
  const [reflexRound, setReflexRound] = useState(0);
  const [clinchProgress, setClinchProgress] = useState(0);
  const [drillErrorPulse, setDrillErrorPulse] = useState(0);

  useEffect(() => {
    if (minigameLab) return;
    window.setTimeout(() => {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as FighterCareerState;
        setState({ ...parsed, currentGym: parsed.currentGym ?? "Unsigned", stats: { ...baseStats, ...parsed.stats } });
      }
    }, 0);
  }, [minigameLab]);

  useEffect(() => {
    if (state && !minigameLab) window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [minigameLab, state]);

  const currentEvent = useMemo<EventDefinition | null>(() => {
    if (!state || state.retired) return null;
    if (forcedEventId) return allCareerEvents.find((event) => event.id === forcedEventId) ?? getNextEvent(state);
    return getNextEvent(state) ?? fallbackEvent(state);
  }, [forcedEventId, state]);

  const filteredEvents = allCareerEvents.filter((event) => {
    const needle = `${event.id} ${event.type} ${event.title}`.toLowerCase();
    return needle.includes(query.toLowerCase());
  });

  const fightPreview = useMemo(() => {
    const fightChoice = pendingFight?.choice ?? currentEvent?.choices.find((choice) => choice.startsFight);
    const previewEvent = pendingFight?.event ?? currentEvent;
    if (!state || !previewEvent || !fightChoice) return null;
    return {
      choice: fightChoice,
      opponent: previewFight(state, fightChoice.fightImportance ?? "normal", `${previewEvent.id}-${fightChoice.id}`),
    };
  }, [currentEvent, pendingFight, state]);

  const drill = pendingFight && state ? drillConfig(pendingFight.choice, pendingFight.event, state, debug || minigameLab ? forcedDrillMode : "") : null;
  const drillTargets = useMemo(() => {
    if (!pendingFight || !drill || !state) return [];
    const seed = `${state.careerSeed}-${pendingFight.event.id}-${pendingFight.choice.id}`;
    return spacedDrillTargets(seed, drill.targets);
  }, [drill, pendingFight, state]);
  const memorySequence = useMemo(() => {
    if (!pendingFight || !drill || !state) return [];
    const seed = `${state.careerSeed}-${pendingFight.event.id}-${pendingFight.choice.id}-memory`;
    return Array.from({ length: 9 }, (_, index) => index)
      .sort((left, right) => seededNumber(seed, left) - seededNumber(seed, right))
      .slice(0, Math.min(8, Math.max(4, Math.round(drill.targets * 0.55))));
  }, [drill, pendingFight, state]);
  const timingTarget = useMemo(() => {
    if (!pendingFight || !state) return 50;
    return 22 + seededNumber(`${state.careerSeed}-${pendingFight.event.id}-${pendingFight.choice.id}-timing`, state.season) * 56;
  }, [pendingFight, state]);
  const comboSequence = useMemo(() => {
    if (!pendingFight || !drill || !state) return [];
    const seed = `${state.careerSeed}-${pendingFight.event.id}-${pendingFight.choice.id}-combo`;
    return nonRepeatingSequence([...comboActions], seed, Math.min(9, Math.max(5, Math.round(drill.targets * 0.72))));
  }, [drill, pendingFight, state]);
  const defenseSequence = useMemo(() => {
    if (!pendingFight || !drill || !state) return [];
    const reads = [
      {
        id: "overhand",
        threat: "Overhand",
        label: "Slip",
        move: "rock" as DefenseMove,
        image: "/UFC/career-defense/overhand-slip.png",
        alt: "Defender slipping outside an overhand punch",
      },
      {
        id: "double-leg",
        threat: "Double leg",
        label: "Sprawl",
        move: "scissors" as DefenseMove,
        image: "/UFC/career-defense/double-leg-sprawl.png",
        alt: "Defender sprawling to stop a double-leg takedown",
      },
      {
        id: "body-kick",
        threat: "Body kick",
        label: "Check",
        move: "rock" as DefenseMove,
        image: "/UFC/career-defense/body-kick-check.png",
        alt: "Defender checking a body kick",
      },
      {
        id: "clinch-rush",
        threat: "Clinch rush",
        label: "Frame",
        move: "paper" as DefenseMove,
        image: "/UFC/career-defense/clinch-frame.png",
        alt: "Defender framing to stop a clinch rush",
      },
      {
        id: "head-kick",
        threat: "Head kick",
        label: "Block",
        move: "scissors" as DefenseMove,
        image: "/UFC/career-defense/head-kick-block.png",
        alt: "Defender blocking a head kick high",
      },
      {
        id: "back-take",
        threat: "Back take",
        label: "Peel",
        move: "paper" as DefenseMove,
        image: "/UFC/career-defense/back-take-peel.png",
        alt: "Defender peeling hands during a back-take scramble",
      },
    ];
    const seed = `${state.careerSeed}-${pendingFight.event.id}-${pendingFight.choice.id}-defense`;
    return nonRepeatingSequence(reads, seed, Math.min(8, Math.max(4, Math.round(drill.targets * 0.62)))).map((read, index) => {
      const correctMove = defenseCounter[read.move];
      const correctOption = reads.find((option) => option.move === correctMove) ?? read;
      const wrongOptions = reads
        .filter((option) => option.id !== correctOption.id && option.move !== correctMove)
        .sort((left, right) => seededNumber(`${seed}-${read.id}-${index}`, reads.indexOf(left)) - seededNumber(`${seed}-${read.id}-${index}`, reads.indexOf(right)))
        .slice(0, 2);
      const options = [correctOption, ...wrongOptions].sort(
        (left, right) => seededNumber(`${seed}-options-${index}`, reads.indexOf(left)) - seededNumber(`${seed}-options-${index}`, reads.indexOf(right)),
      );
      return { ...read, answer: correctOption.id, options };
    });
  }, [drill, pendingFight, state]);
  const footworkSequence = useMemo(() => {
    if (!pendingFight || !drill || !state) return [];
    const steps: (keyof typeof footworkCards)[] = ["Step left", "Step right", "Pivot out", "Level change", "Exit back", "Cut angle"];
    const seed = `${state.careerSeed}-${pendingFight.event.id}-${pendingFight.choice.id}-footwork`;
    return nonRepeatingSequence(steps, seed, Math.min(9, Math.max(5, Math.round(drill.targets * 0.68))));
  }, [drill, pendingFight, state]);
  const clinchTarget = useMemo(() => {
    if (!pendingFight || !state) return 50;
    return 24 + seededNumber(`${state.careerSeed}-${pendingFight.event.id}-${pendingFight.choice.id}-clinch-${clinchProgress}`, state.season) * 52;
  }, [clinchProgress, pendingFight, state]);

  useEffect(() => {
    if (!drillStarted || !drill || drill.mode !== "circles" || targetIndex >= drill.targets) return;
    const timer = window.setTimeout(() => {
      const nextMisses = drillMisses + 1;
      const nextTargetIndex = targetIndex + 1;
      markDrillError();
      if (nextTargetIndex >= drill.targets) {
        resolveDrillScore(drillHits > drill.targets / 2 ? 100 : 0);
        return;
      }
      setDrillMisses(nextMisses);
      setTargetIndex(nextTargetIndex);
    }, drill.speed);
    return () => window.clearTimeout(timer);
    // The timer intentionally tracks the current target snapshot; resolveDrillScore is called only at terminal state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drill, drillHits, drillMisses, drillStarted, targetIndex]);

  useEffect(() => {
    if (!drillStarted || !drill || !["combo", "defense", "footwork"].includes(drill.mode)) return;
    const sequenceLength = drill.mode === "combo" ? comboSequence.length : drill.mode === "defense" ? defenseSequence.length : footworkSequence.length;
    if (targetIndex >= sequenceLength) return;
    const timer = window.setTimeout(() => {
      const nextMisses = drillMisses + 1;
      const nextTargetIndex = targetIndex + 1;
      markDrillError();
      if (nextTargetIndex >= sequenceLength || nextMisses >= 4) {
        const attempts = Math.max(1, drillHits + nextMisses);
        resolveDrillScore(Math.round((drillHits / attempts) * 100));
        return;
      }
      setDrillMisses(nextMisses);
      setTargetIndex(nextTargetIndex);
    }, drill.actionTime);
    return () => window.clearTimeout(timer);
    // The action timer is keyed to the current prompt and intentionally resolves through the current drill snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comboSequence.length, defenseSequence.length, drill, drillHits, drillMisses, drillStarted, footworkSequence.length, targetIndex]);

  useEffect(() => {
    if (!drillStarted || !drill || drill.mode !== "reflex" || !reflexReady || reflexActivePad === null || timingScore !== null) return;
    const timer = window.setTimeout(() => {
      hitReflexPad(-1);
    }, Math.max(850, drill.actionTime * 0.5));
    return () => window.clearTimeout(timer);
    // The timeout resolves the currently visible reflex pad only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drill, drillStarted, reflexActivePad, reflexReady, timingScore]);

  function startCareer(seed = careerSeed) {
    setState(createInitialCareer({ name, nationality, age, weightClass, fightingStyle, careerSeed: seed }));
    setForcedEventId("");
    setShopOpen(false);
    setResultNotice(null);
  }

  function copyResult() {
    if (!state) return;
    const text = `GRDX1 ROAD TO GLORY\n${state.name}\n${state.legacyRank ?? state.stage}\n${record(state)}\n${state.titles.length}x champion, ${state.defenses} defenses\nLegacy ${state.legacyScore ?? 0}\nCan you beat my career?`;
    void navigator.clipboard?.writeText(text);
  }

  function resetDrill() {
    setDrillHits(0);
    setDrillMisses(0);
    setDrillStarted(false);
    setMemoryRevealed(false);
    setMemoryPicked([]);
    setMemoryWrong([]);
    setTargetIndex(0);
    setTimingStart(0);
    setTimingScore(null);
    setTimingCursor(null);
    setReflexReady(false);
    setReflexStartedAt(0);
    setReflexActivePad(null);
    setReflexRound(0);
    setClinchProgress(0);
    setDrillErrorPulse(0);
  }

  function markDrillError() {
    setDrillErrorPulse(Date.now());
  }

  function rareBonusFor(event: EventDefinition, choice: EventChoice) {
    if (!state) return null;
    if (!Object.values(choice.effects ?? {}).some((value) => typeof value === "number")) return null;
    const roll = seededNumber(`${state.careerSeed}-${event.id}-${choice.id}-rare`, state.season);
    if (roll > 0.08) return null;
    const effectStats = Object.keys(choice.effects ?? {}).filter((key) => statKeys.includes(key as keyof FighterStats)) as (keyof FighterStats)[];
    const pool = effectStats.length ? effectStats : statKeys;
    const stat = pool[Math.floor(seededNumber(`${state.careerSeed}-${choice.id}-rare-stat`, state.rngStep) * pool.length)] ?? "fightIq";
    return { stat, value: 5 };
  }

  function choiceWithRareBonus(event: EventDefinition, choice: EventChoice) {
    const rare = rareBonusFor(event, choice);
    const boostedChoice = rare
      ? { ...choice, effects: { ...(choice.effects ?? {}), [rare.stat]: ((choice.effects?.[rare.stat] as number | undefined) ?? 0) + rare.value } }
      : choice;
    return normalizeChoiceForEvent(event, boostedChoice);
  }

  function visibleEffects(event: EventDefinition, choice: EventChoice) {
    const normalizedChoice = choiceWithRareBonus(event, choice);
    const entries = Object.entries(normalizedChoice.effects ?? {}).filter(([, value]) => typeof value === "number") as [string, number][];
    const rare = rareBonusFor(event, choice);
    return entries
      .map(([key, value]) => ({
        key,
        label: statLabels[key as keyof FighterStats] ?? effectLabels[key] ?? key,
        value,
        rare: rare?.stat === key,
      }))
      .slice(0, 3);
  }

  function resolveChoice(event: EventDefinition, choice: EventChoice, preparationBonus = 0) {
    const previousHistoryLength = state!.history.length;
    const nextState = chooseEvent(state!, event, choice, preparationBonus);
    const fightResult = nextState.history.slice(previousHistoryLength).find((item) => item.type === "fight");
    setResultNotice(
      fightResult
        ? {
            detail: `${fightResult.detail}. ${preparationBonus >= 8 ? "Great camp raised your finishing threat." : preparationBonus <= -6 ? "Poor prep hurt your chances and cost extra damage." : "Camp was steady enough to keep the plan alive."}`,
            title: fightResult.title,
          }
        : null,
    );
    setState(nextState);
    setForcedEventId("");
    setPendingFight(null);
    resetDrill();
  }

  function buyShopItem(choice: EventChoice) {
    if (!state) return;
    const event = shopEvent(state);
    const nextState = chooseEvent(state, event, normalizeChoiceForEvent(event, choice));
    setState(nextState);
    setShopOpen(false);
    setResultNotice(null);
  }

  function chooseCareerOption(event: EventDefinition, choice: EventChoice) {
    const resolvedChoice = choiceWithRareBonus(event, choice);
    if (fightNeedsDrill(resolvedChoice)) {
      setPendingFight({ choice: resolvedChoice, event });
      resetDrill();
      return;
    }
    resolveChoice(event, resolvedChoice);
  }

  function resolveDrillScore(score: number) {
    if (!pendingFight || !drill) return;
    const preparationBonus = drillPasses(drill.mode, score, drill.par) ? 100 : -100;
    resolveChoice(pendingFight.event, pendingFight.choice, preparationBonus);
  }

  function startDrill() {
    if (!state || !drill) return;
    setDrillStarted(true);
    if (drill?.mode === "memory") {
      setMemoryRevealed(true);
      window.setTimeout(() => setMemoryRevealed(false), Math.max(1400, 3100 - state.record.wins * 120));
    }
    if (drill?.mode === "timing") setTimingStart(Date.now());
    if (drill?.mode === "breathing" || drill?.mode === "clinch") setTimingStart(Date.now());
    if (drill?.mode === "reflex") {
      queueReflexPad(0);
    }
  }

  function startMinigameLabDrill(mode: DrillMode) {
    if (!minigameLab || !state || !minigameLabChoice) return;
    resetDrill();
    setResultNotice(null);
    setForcedDrillMode(mode);
    setPendingFight({ choice: minigameLabChoice, event: minigameLabEvent });
  }

  function changeMinigameLabDifficulty(difficulty: MinigameLabDifficulty) {
    setLabDifficulty(difficulty);
    setPendingFight(null);
    setResultNotice(null);
    resetDrill();
    setState(createMinigameLabCareer(difficulty));
  }

  function horizontalTimingScore(trackSelector: string, cursorSelector: string, targetPercent: number, zonePercent: number) {
    const track = document.querySelector(trackSelector);
    const cursor = document.querySelector(cursorSelector);
    if (!track || !cursor) return { cursorPercent: 0, score: 0 };
    const trackRect = track.getBoundingClientRect();
    const cursorRect = cursor.getBoundingClientRect();
    const cursorCenter = cursorRect.left + cursorRect.width / 2;
    const cursorPercent = Math.max(0, Math.min(100, ((cursorCenter - trackRect.left) / trackRect.width) * 100));
    const distance = Math.abs(cursorPercent - targetPercent);
    const score = distance <= zonePercent / 2 ? 100 : Math.max(0, Math.round(100 - distance * 3.4));
    return { cursorPercent, score };
  }

  function stopTimingBar() {
    if (!drillStarted || !drill || timingScore !== null) return;
    const { cursorPercent, score } = horizontalTimingScore(".career-timing-track", ".career-timing-track b", timingTarget, drill.zone);
    setTimingCursor(cursorPercent);
    setTimingScore(score);
    if (score < drill.par) markDrillError();
    window.setTimeout(() => resolveDrillScore(score), 650);
  }

  function stopBreathingDrill() {
    if (!drillStarted || !drill || drill.mode !== "breathing" || timingScore !== null) return;
    const elapsed = (Date.now() - timingStart) % drill.speed;
    const cursor = (elapsed / drill.speed) * 100;
    const target = 50;
    const distance = Math.abs(cursor - target);
    const score = distance <= 18 ? 100 : Math.max(0, Math.round(100 - (distance - 18) * 2.2));
    setTimingCursor(cursor);
    setTimingScore(score);
    if (score < drill.par) markDrillError();
    window.setTimeout(() => resolveDrillScore(score), 650);
  }

  function pickCombo(action: string) {
    if (!drillStarted || !drill || drill.mode !== "combo") return;
    const expected = comboSequence[targetIndex];
    if (action === expected) {
      const nextHits = drillHits + 1;
      const nextTargetIndex = targetIndex + 1;
      if (nextTargetIndex >= comboSequence.length) {
        const attempts = Math.max(1, nextHits + drillMisses);
        resolveDrillScore(Math.round((nextHits / attempts) * 100));
        return;
      }
      setDrillHits(nextHits);
      setTargetIndex(nextTargetIndex);
      return;
    }
    const nextMisses = drillMisses + 1;
    markDrillError();
    if (nextMisses >= 4) {
      const attempts = Math.max(1, drillHits + nextMisses);
      resolveDrillScore(Math.round((drillHits / attempts) * 100));
      return;
    }
    setDrillMisses(nextMisses);
  }

  function answerDefense(answer: string) {
    if (!drillStarted || !drill || drill.mode !== "defense") return;
    const expected = defenseSequence[targetIndex]?.answer;
    const nextHits = drillHits + (answer === expected ? 1 : 0);
    const nextMisses = drillMisses + (answer === expected ? 0 : 1);
    const nextTargetIndex = targetIndex + 1;
    if (answer !== expected) markDrillError();
    if (nextTargetIndex >= defenseSequence.length) {
      const attempts = Math.max(1, nextHits + nextMisses);
      resolveDrillScore(Math.round((nextHits / attempts) * 100));
      return;
    }
    setDrillHits(nextHits);
    setDrillMisses(nextMisses);
    setTargetIndex(nextTargetIndex);
  }

  function pickFootwork(step: string) {
    if (!drillStarted || !drill || drill.mode !== "footwork") return;
    const expected = footworkSequence[targetIndex];
    const nextHits = drillHits + (step === expected ? 1 : 0);
    const nextMisses = drillMisses + (step === expected ? 0 : 1);
    const nextTargetIndex = targetIndex + 1;
    if (step !== expected) markDrillError();
    if (nextTargetIndex >= footworkSequence.length) {
      const attempts = Math.max(1, nextHits + nextMisses);
      resolveDrillScore(Math.round((nextHits / attempts) * 100));
      return;
    }
    setDrillHits(nextHits);
    setDrillMisses(nextMisses);
    setTargetIndex(nextTargetIndex);
  }

  function clinchRep() {
    if (!drillStarted || !drill || drill.mode !== "clinch") return;
    const { score } = horizontalTimingScore(".career-clinch-track", ".career-clinch-track b", clinchTarget, drill.zone);
    const inControl = score === 100;
    const nextProgress = clinchProgress + (inControl ? 1 : 0);
    const nextMisses = drillMisses + (inControl ? 0 : 1);
    const targetReps = Math.max(6, Math.round(drill.targets * 0.65));
    if (!inControl) markDrillError();
    if (nextProgress >= targetReps || nextMisses >= 4) {
      const attempts = Math.max(1, nextProgress + nextMisses);
      resolveDrillScore(Math.round((nextProgress / attempts) * 100));
      return;
    }
    setClinchProgress(nextProgress);
    setDrillMisses(nextMisses);
  }

  function queueReflexPad(round: number) {
    if (!state || !drill) return;
    setReflexReady(false);
    setReflexActivePad(null);
    const delay = 450 + seededNumber(`${state.careerSeed}-reflex-delay-${round}`, state.season + state.rngStep) * Math.max(850, drill.actionTime * 0.45);
    window.setTimeout(() => {
      setReflexActivePad(Math.floor(seededNumber(`${state.careerSeed}-reflex-pad-${round}`, state.season) * 9));
      setReflexStartedAt(Date.now());
      setReflexReady(true);
    }, delay);
  }

  function hitReflexPad(pad: number) {
    if (!drillStarted || !drill || drill.mode !== "reflex") return;
    const correct = reflexReady && reflexActivePad === pad;
    const reaction = correct ? Date.now() - reflexStartedAt : drill.actionTime;
    const nextHits = drillHits + (correct ? 1 : 0);
    const nextMisses = drillMisses + (correct ? 0 : 1);
    const targetHits = 6;
    if (!correct) markDrillError();
    if (nextHits >= targetHits || nextMisses >= 3) {
      const attempts = Math.max(1, nextHits + nextMisses);
      const reactionScore = correct ? Math.max(0, Math.round(110 - reaction / 14)) : 0;
      const accuracyScore = Math.round((nextHits / attempts) * 100);
      const score = Math.round((accuracyScore + reactionScore) / 2);
      setTimingScore(score);
      window.setTimeout(() => resolveDrillScore(score), 520);
      return;
    }
    setDrillHits(nextHits);
    setDrillMisses(nextMisses);
    setReflexRound((value) => value + 1);
    queueReflexPad(reflexRound + 1);
  }

  if (!state && minigameLab) {
    return (
      <section className="career-shell">
        <div className="career-panel career-event">
          <p className="tech-label ufc-label">MINIGAME LAB</p>
          <h1>Loading drills.</h1>
        </div>
      </section>
    );
  }

  if (!state) {
    return (
      <section className="career-shell career-setup">
        <div className="career-setup-copy">
          <p className="tech-label ufc-label">GRDX1 ROAD TO GLORY</p>
          <h1>Create your fighter.</h1>
          <p>Build an MMA career through fast choices, seeded events, fight simulation, contracts, title runs and retirement.</p>
        </div>
        <div className="career-panel">
          <label className="field">Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="" /></label>
          <label className="field">Nationality<select value={nationality} onChange={(event) => setNationality(event.target.value)}>{nationalityOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field">Age<input min={18} max={22} type="number" value={age} onChange={(event) => setAge(Number(event.target.value))} /></label>
          <label className="field">Weight class<select value={weightClass} onChange={(event) => setWeightClass(event.target.value)}>{weightClasses.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field">Fighting style<select value={fightingStyle} onChange={(event) => setFightingStyle(event.target.value as FightingStyleId)}>{Object.entries(fightingStyles).map(([id, style]) => <option key={id} value={id}>{style.label}</option>)}</select></label>
          <label className="field">Career seed<input value={careerSeed} onChange={(event) => setCareerSeed(event.target.value)} /></label>
          <div className="career-actions">
            <button className="button-primary ufc-primary" type="button" onClick={() => startCareer()}>Start career</button>
            <button className="button-secondary" type="button" onClick={() => startCareer(dailyCareerSeed())}>Today&apos;s challenge</button>
          </div>
        </div>
      </section>
    );
  }

  const statItems = Object.entries(state.stats) as [keyof FighterStats, number][];
  const overall = Math.round(statItems.reduce((sum, [, value]) => sum + value, 0) / statItems.length);
  const finishWins = state.record.koWins + state.record.submissionWins;
  const currentGym = state.currentGym ?? "Unsigned";
  const comboWindowIndex = Math.max(0, Math.min(Math.max(0, comboSequence.length - 2), targetIndex - 1));

  return (
    <section className="career-shell">
      <div className="career-topbar">
        <div>
          <p className="tech-label ufc-label">AGE {state.age} - {state.stage}</p>
          <h1>{state.name}</h1>
          <span>{state.nationality} - {state.weightClass} - {fightingStyles[state.fightingStyle].label}</span>
        </div>
        <div className="career-actions">
          {minigameLab ? null : <button className="button-secondary" type="button" onClick={() => setState(retireCareer(state))}>Retire</button>}
          {minigameLab ? null : <button className="button-secondary" type="button" onClick={() => setShopOpen(true)}>Shop</button>}
          <button className="button-secondary" type="button" onClick={() => { window.localStorage.removeItem(storageKey); setPendingFight(null); setState(minigameLab ? createMinigameLabCareer(labDifficulty) : null); }}>New fighter</button>
        </div>
      </div>

      {minigameLab ? (
        <section className="career-panel career-minigame-lab">
          <div>
            <span>Minigame test route</span>
            <strong>Pick one drill</strong>
          </div>
          <label>
            <span>Difficulty</span>
            <select value={labDifficulty} onChange={(event) => changeMinigameLabDifficulty(event.target.value as MinigameLabDifficulty)}>
              {minigameLabDifficulties.map((difficulty) => (
                <option key={difficulty.id} value={difficulty.id}>{difficulty.label} - {difficulty.detail}</option>
              ))}
            </select>
          </label>
          <div>
            {minigameLabModes.map((mode) => (
              <button
                className={forcedDrillMode === mode ? "is-debug-active" : ""}
                key={mode}
                onClick={() => startMinigameLabDrill(mode)}
                type="button"
              >
                {mode}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="career-dashboard-row">
        <aside className="career-vitrine career-panel">
          <span>Vitrine</span>
          <div>
            {state.titles.length ? <Image alt="" height={42} src="/UFC/icons/cinturon.png" width={42} /> : null}
            {state.defenses ? <Image alt="" height={42} src="/UFC/icons/defensa_cinturon.png" width={42} /> : null}
            {finishWins ? <Image alt="" height={42} src="/UFC/icons/ko.png" width={42} /> : null}
            <Image alt="" height={42} src="/UFC/icons/victory.png" width={42} />
          </div>
          <small>{state.titles.length} belts - {state.defenses} defenses</small>
        </aside>

        <section className="career-athlete-card">
          <div className="career-rating">
            <strong>{overall}</strong>
            <span>Overall</span>
          </div>
          <div className="career-athlete-main">
            <p className="tech-label ufc-label">{state.organization} - {careerYear(state.season)}</p>
            <h2>{state.name}</h2>
            <div className="career-athlete-meta">
              <span>{state.nationality}</span>
              <span>{state.stage}</span>
              <span>{state.weightClass}</span>
              <span>{currentGym}</span>
            </div>
          </div>
          <div className="career-badge-mark">
            <span>{state.name.slice(0, 1).toUpperCase()}</span>
          </div>
          <div className="career-stat-strip">
            {[
              ["Record", record(state), "/UFC/icons/victory.png"],
              ["Finishes", String(finishWins), "/UFC/icons/ko.png"],
              ["KO/TKO", String(state.record.koWins), "/UFC/icons/ko.png"],
              ["Subs", String(state.record.submissionWins), "/UFC/icons/victory.png"],
              ["Belts", String(state.titles.length), "/UFC/icons/cinturon.png"],
              ["Defenses", String(state.defenses), "/UFC/icons/defensa_cinturon.png"],
              ["Money", money(state.money), ""],
            ].map(([label, value, icon]) => (
              <div key={label}>
                {icon ? <Image alt="" height={22} src={icon} width={22} /> : null}
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="career-reputation-card">
            <div>
              <span>Reputation</span>
              <strong>{state.reputation}/100</strong>
            </div>
            <i><b style={{ width: `${state.reputation}%` }} /></i>
            <small>{state.reputation >= 75 ? "Elite sponsors unlocked" : state.reputation >= 55 ? "Premium sponsors available" : "Wins, belts and clean choices raise this"}</small>
          </div>
          <div className="career-attribute-grid">
            {statItems.map(([key, value]) => (
              <div key={key}>
                <span>{statLabels[key]}</span>
                <b>{value}</b>
                <i style={{ width: `${value}%` }} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {minigameLab ? null : (
        <button aria-label="Open shop" className="career-shop-fab" type="button" onClick={() => setShopOpen(true)}>
          <span>Shop</span>
        </button>
      )}

      <div className="career-layout">
        <aside className="career-panel career-status">
          {[
            ["Record", record(state)],
            ["Health", `${state.health}%`],
            ["Confidence", `${state.confidence}%`],
            ["Popularity", String(state.popularity)],
            ["Reputation", String(state.reputation)],
            ["Money", money(state.money)],
            ["Ranking", state.ranking ? `#${state.ranking}` : "Unranked"],
            ["Titles", String(state.titles.length)],
            ["Defenses", String(state.defenses)],
          ].map(([label, value]) => (
            <div key={label}><span>{label}</span><b>{value}</b></div>
          ))}
        </aside>

        <main className="career-panel career-event">
          {state.retired ? (
            <div className="legacy-card">
              <p>GRDX1 ROAD TO GLORY</p>
              <h2>{state.name}</h2>
              <strong>{state.legacyRank}</strong>
              <div>{record(state)}</div>
              <span>{state.titles.length}x WORLD CHAMPION - {state.defenses} TITLE DEFENSES</span>
              <b>LEGACY {state.legacyScore}</b>
              <small>CAN YOU BEAT MY CAREER?</small>
              <div className="career-actions"><button className="button-primary ufc-primary" onClick={copyResult} type="button">Copy result</button><button className="button-secondary" onClick={() => setState(null)} type="button">Play again</button></div>
            </div>
          ) : resultNotice && !pendingFight ? (
            <article className="career-result-card">
              <span>{minigameLab ? "Drill result" : "Fight result"}</span>
              <h2>{resultNotice.title}</h2>
              <p>{resultNotice.detail}</p>
              <button className="button-primary ufc-primary" onClick={() => setResultNotice(null)} type="button">{minigameLab ? "Back to lab" : "Continue career"}</button>
            </article>
          ) : minigameLab && !pendingFight ? (
            <article className="career-result-card">
              <span>Minigame lab</span>
              <h2>Choose a drill above.</h2>
              <p>Use this route to test each camp minigame directly without playing through career events.</p>
            </article>
          ) : currentEvent ? (
            <>
              <p className={`career-sentiment ${currentEvent.type}`}>{currentEvent.type.replace("_", " ")}</p>
              <h2>{currentEvent.title}</h2>
              <p>{currentEvent.description}</p>
              {fightPreview ? (
                <div className="career-fight-preview">
                  <div className="career-fighter-poster">
                    <div className="career-fighter-avatar career-player-avatar">
                      <span>{state.name.slice(0, 1).toUpperCase()}</span>
                    </div>
                    <div>
                      <small>You</small>
                      <strong>{state.name}</strong>
                      <span>{record(state)} - {state.weightClass}</span>
                    </div>
                  </div>
                  <b>VS</b>
                  <div className="career-fighter-poster">
                    <div className="career-fighter-avatar">
                      {fightPreview.opponent.imageUrl ? (
                        <Image alt="" height={120} src={fightPreview.opponent.imageUrl} unoptimized width={120} />
                      ) : (
                        <span>{fightPreview.opponent.name.slice(0, 1)}</span>
                      )}
                    </div>
                    <div>
                      <small>{fightPreview.choice.fightImportance ?? "fight"} {fightPreview.opponent.ranking ? `- #${fightPreview.opponent.ranking}` : ""}</small>
                      <strong>{fightPreview.opponent.name}</strong>
                      <span>{fightPreview.opponent.record} - {fightPreview.opponent.weightClass}</span>
                    </div>
                  </div>
                  <p>{fightPreview.choice.fightNarrative ?? fightPreview.opponent.narrative}</p>
                  <span className="career-fight-badge">{fightBadge(currentEvent, fightPreview.choice)}</span>
                </div>
              ) : null}
              {pendingFight && drill ? (
                <div className="career-drill">
                  <div className="career-drill-head">
                    <div>
                      <span>{drill.label}</span>
                      <strong>
                        {drill.mode === "timing"
                          ? timingScore === null
                            ? `Stop in the marked zone - par ${drill.par}`
                            : `Timing score ${timingScore} - par ${drill.par}`
                          : drill.mode === "combo"
                            ? `${drillHits}/${comboSequence.length} combo reads - need accuracy`
                            : drill.mode === "defense"
                              ? `${drillHits}/${defenseSequence.length} defensive reads`
                              : drill.mode === "reflex"
                                ? timingScore === null
                                  ? "Wait for the flash, then hit"
                                  : `Reaction score ${timingScore} - par ${drill.par}`
                                : drill.mode === "breathing"
                                  ? timingScore === null
                                    ? "Stop inside the calm window"
                                    : `Composure score ${timingScore} - par ${drill.par}`
                                  : drill.mode === "footwork"
                                    ? `${drillHits}/${footworkSequence.length} footwork reads`
                                    : drill.mode === "clinch"
                                      ? `${clinchProgress}/${Math.max(6, Math.round(drill.targets * 0.65))} clean clinch entries`
                                      : `${drillHits}/${drill.mode === "memory" ? memorySequence.length : drill.targets} clean actions - need majority`}
                      </strong>
                    </div>
                    <b>{drillMisses} misses</b>
                  </div>
                  <div
                    className={`career-drill-board career-drill-${drill.mode}${drillStarted ? " is-live" : ""}${drillErrorPulse ? " is-error" : ""}`}
                    key={`drill-board-${drill.mode}-${drillErrorPulse}`}
                  >
                    {!drillStarted ? (
                      <div className="career-drill-ready">
                        <strong>
                          {drill.mode === "memory"
                            ? "Read the sequence"
                            : drill.mode === "timing"
                              ? "Time the entry"
                              : drill.mode === "combo"
                                ? "Call the combo"
                                : drill.mode === "reflex"
                                  ? "React on flash"
                                  : drill.mode === "defense"
                                    ? "Read the threat"
                                    : drill.mode === "breathing"
                                      ? "Control breathing"
                                      : drill.mode === "footwork"
                                        ? "Move on command"
                                        : drill.mode === "clinch"
                                          ? "Win the clinch"
                                          : "Read the rhythm"}
                        </strong>
                        <span>
                          {drill.mode === "memory"
                            ? "Memorize the pads, then repeat them in order. Mistakes hurt preparation."
                            : drill.mode === "timing"
                              ? "Start the bar, then stop it inside the marked zone."
                              : drill.mode === "combo"
                                ? "Press the next command in the called sequence before mistakes pile up."
                                : drill.mode === "reflex"
                                    ? "Wait until the pad flashes. Pressing early ruins the rep."
                                    : drill.mode === "defense"
                                    ? "Top card is the rival move. Pick the bottom card that wins the counter rule."
                                    : drill.mode === "breathing"
                                      ? "Let the pulse settle, then stop it near the center calm window."
                                      : drill.mode === "footwork"
                                        ? "Pick each movement command in order to stay off the fence."
                                        : drill.mode === "clinch"
                                          ? "Click when the moving marker enters the control window. Spamming gives misses."
                                          : "Hit each shrinking circle before it closes. Complete the majority to win."}
                        </span>
                        <button className="button-primary ufc-primary" type="button" onClick={(event) => { event.stopPropagation(); startDrill(); }}>Start drill</button>
                      </div>
                    ) : drill.mode === "memory" ? (
                      <div className="career-memory-grid">
                        {Array.from({ length: 9 }, (_, index) => {
                          const active = memoryRevealed && memorySequence.includes(index);
                          const picked = memoryPicked.includes(index);
                          const wrong = memoryWrong.includes(index);
                          return (
                            <button
                              aria-label={`Pad ${index + 1}`}
                              className={[active ? "is-memory-active" : "", picked ? "is-memory-picked" : "", wrong ? "is-memory-wrong" : ""].filter(Boolean).join(" ")}
                              disabled={memoryRevealed || targetIndex >= memorySequence.length}
                              key={index}
                              onClick={() => {
                                if (memorySequence[targetIndex] === index) {
                                  const nextHits = drillHits + 1;
                                  const nextTargetIndex = targetIndex + 1;
                                  setMemoryPicked((value) => [...value, index]);
                                  if (nextTargetIndex >= memorySequence.length) {
                                    const attempts = Math.max(1, nextHits + drillMisses);
                                    resolveDrillScore(Math.round((nextHits / attempts) * 100));
                                    return;
                                  }
                                  setDrillHits(nextHits);
                                  setTargetIndex(nextTargetIndex);
                                } else {
                                  const nextMisses = drillMisses + 1;
                                  setMemoryWrong((value) => [...value, index]);
                                  markDrillError();
                                  if (nextMisses >= 3) {
                                    const attempts = Math.max(1, drillHits + nextMisses);
                                    resolveDrillScore(Math.round((drillHits / attempts) * 100));
                                    return;
                                  }
                                  setDrillMisses(nextMisses);
                                }
                              }}
                              type="button"
                            >
                              {memoryRevealed && active ? memorySequence.indexOf(index) + 1 : ""}
                            </button>
                          );
                        })}
                        <span className="career-memory-prompt">
                          {memoryRevealed ? "Memorize the glowing pads in order." : `Repeat the order: step ${targetIndex + 1} of ${memorySequence.length}.`}
                        </span>
                      </div>
                    ) : drill.mode === "timing" ? (
                      <div className="career-timing-drill">
                        <div className="career-timing-track">
                          <i style={{ left: `${timingTarget}%`, width: `${drill.zone}%` }} />
                          <b
                            className={timingScore !== null ? "is-timing-stopped" : ""}
                            style={
                              timingScore !== null && timingCursor !== null
                                ? { left: `${timingCursor}%` }
                                : { animationDuration: `${drill.speed}ms` }
                            }
                          />
                        </div>
                        {timingScore !== null ? (
                          <span className={`career-timing-result ${timingScore >= drill.par ? "is-win" : "is-loss"}`}>
                            Stopped at {Math.round(timingCursor ?? 0)}% - target {Math.round(timingTarget)}%
                          </span>
                        ) : null}
                        <button className="button-primary ufc-primary" disabled={timingScore !== null} onClick={stopTimingBar} type="button">Stop bar</button>
                      </div>
                    ) : drill.mode === "breathing" ? (
                      <div className="career-breathing-drill">
                        <div className="career-breathing-ring">
                          <i />
                          <b
                            className={timingScore !== null ? "is-breathing-stopped" : ""}
                            style={
                              timingScore !== null && timingCursor !== null
                                ? { transform: `rotate(${timingCursor * 3.6}deg)` }
                                : { animationDuration: `${drill.speed * 1.8}ms` }
                            }
                          />
                          <span>{timingScore !== null ? timingScore : "CALM"}</span>
                        </div>
                        <button className="button-primary ufc-primary" disabled={timingScore !== null} onClick={stopBreathingDrill} type="button">Lock breath</button>
                      </div>
                    ) : drill.mode === "combo" ? (
                      <div className="career-combo-drill">
                        <span className="career-action-timer" key={`combo-timer-${targetIndex}`} style={{ animationDuration: `${drill.actionTime}ms` }} />
                        <div className="career-combo-sequence" aria-label="Combo sequence">
                          <div className="career-combo-sequence-track" style={{ "--combo-window-index": comboWindowIndex } as CSSProperties}>
                            {comboSequence.map((action, index) => (
                              <figure
                                className={index < targetIndex ? "is-combo-done" : index === targetIndex ? "is-combo-current" : ""}
                                key={`${action}-${index}`}
                              >
                                <Image alt="" fill sizes="(max-width: 760px) 18vw, 72px" src={comboCards[action].image} />
                              </figure>
                            ))}
                          </div>
                        </div>
                        <div className="career-combo-pad">
                          {comboActions.map((action) => (
                            <button
                              aria-label={comboCards[action].alt}
                              className={comboSequence[targetIndex] === action ? "is-combo-target" : ""}
                              key={action}
                              onClick={() => pickCombo(action)}
                              type="button"
                            >
                              <Image alt="" fill sizes="(max-width: 760px) 42vw, 160px" src={comboCards[action].image} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : drill.mode === "reflex" ? (
                      <div className="career-reflex-drill">
                        <div className="career-reflex-grid">
                          {Array.from({ length: 9 }, (_, index) => (
                            <button
                              className={reflexReady && reflexActivePad === index ? "is-reflex-live" : ""}
                              disabled={timingScore !== null}
                              key={index}
                              onClick={() => hitReflexPad(index)}
                              type="button"
                            >
                              {timingScore !== null ? timingScore : reflexReady && reflexActivePad === index ? "HIT" : "WAIT"}
                            </button>
                          ))}
                        </div>
                        <span>{timingScore !== null ? "Reaction logged." : `${drillHits}/6 clean reactions - ${drillMisses}/3 mistakes`}</span>
                      </div>
                    ) : drill.mode === "defense" && defenseSequence[targetIndex] ? (
                      <div className="career-defense-drill">
                        <span className="career-action-timer" key={`defense-timer-${targetIndex}`} style={{ animationDuration: `${drill.actionTime}ms` }} />
                        <figure className="career-defense-threat-card">
                          <Image
                            alt={defenseSequence[targetIndex].alt}
                            fill
                            sizes="(max-width: 760px) 78vw, 260px"
                            src={defenseSequence[targetIndex].image}
                          />
                          <span className="career-defense-move-icon" aria-label="Rival move">{defenseMoveSymbols[defenseSequence[targetIndex].move]}</span>
                        </figure>
                        <div>
                          {defenseSequence[targetIndex].options.map((option) => (
                            <button aria-label="Choose response" key={option.id} onClick={() => answerDefense(option.id)} type="button">
                              <Image alt="" fill sizes="(max-width: 760px) 28vw, 128px" src={option.image} />
                              <span className="career-defense-move-icon" aria-hidden="true">{defenseMoveSymbols[option.move]}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : drill.mode === "footwork" && footworkSequence[targetIndex] ? (
                      <div className="career-footwork-drill">
                        <span className="career-action-timer" key={`footwork-timer-${targetIndex}`} style={{ animationDuration: `${drill.actionTime}ms` }} />
                        <figure className="career-footwork-target">
                          <Image alt={footworkCards[footworkSequence[targetIndex]].alt} fill sizes="(max-width: 760px) 70vw, 230px" src={footworkCards[footworkSequence[targetIndex]].image} />
                          <figcaption>MOVE NOW</figcaption>
                        </figure>
                        <div>
                          {Object.entries(footworkCards).map(([step, card]) => (
                            <button aria-label={card.alt} key={step} onClick={() => pickFootwork(step)} type="button">
                              <Image alt="" fill sizes="(max-width: 760px) 27vw, 112px" src={card.image} />
                              <span>{card.shortLabel}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : drill.mode === "clinch" ? (
                      <div className="career-clinch-drill">
                        <div className="career-clinch-track">
                          <i style={{ left: `${clinchTarget}%`, width: `${drill.zone}%` }} />
                          <b style={{ animationDuration: `${drill.speed}ms` }} />
                        </div>
                        <button onClick={clinchRep} type="button">Pummel for position</button>
                        <span>{clinchProgress}/{Math.max(6, Math.round(drill.targets * 0.65))} clean entries - {drillMisses}/4 misses</span>
                      </div>
                    ) : drillTargets[targetIndex] ? (
                      <button
                        aria-label="Hit shrinking circle"
                        className="career-drill-circle"
                        key={`circle-${targetIndex}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          const nextHits = drillHits + 1;
                          const nextTargetIndex = targetIndex + 1;
                          if (nextTargetIndex >= drill.targets) {
                            const passed = nextHits > drill.targets / 2;
                            resolveDrillScore(passed ? 100 : 0);
                            return;
                          }
                          setDrillHits(nextHits);
                          setTargetIndex(nextTargetIndex);
                        }}
                        style={{
                          "--circle-speed": `${drill.speed}ms`,
                          height: Math.max(52, drill.size * 1.8),
                          animationDuration: `${drill.speed}ms`,
                          left: `${drillTargets[targetIndex].left}%`,
                          top: `${drillTargets[targetIndex].top}%`,
                          width: Math.max(52, drill.size * 1.8),
                        } as CSSProperties}
                        type="button"
                      >
                        <span />
                      </button>
                    ) : (
                      <div className="career-drill-finished">
                        <strong>Camp complete</strong>
                        <span>Resolve the fight with your preparation score.</span>
                      </div>
                    )}
                  </div>
                  <div className="career-actions">
                    <button className="button-secondary" type="button" onClick={() => { setPendingFight(null); resetDrill(); }}>Change decision</button>
                  </div>
                </div>
              ) : (
                <div className="career-choice-grid">
                  {currentEvent.choices.map((choice) => {
                    const effects = visibleEffects(currentEvent, choice);
                    return (
                      <button key={choice.id} className="career-choice" type="button" onClick={() => chooseCareerOption(currentEvent, choice)}>
                        <strong>{choice.label}</strong>
                        {choice.detail ? <span>{choice.detail}</span> : null}
                        {effects.length ? (
                          <div className="career-choice-effects">
                            {effects.map((effect) => (
                              <em className={effect.rare ? "is-rare" : effect.value < 0 ? "is-negative" : ""} key={effect.key}>
                                {effect.value > 0 ? "+" : ""}{effect.value} {effect.label}
                              </em>
                            ))}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}
        </main>
      </div>

      {debug ? (
        <section className="career-panel career-debug">
          <h2>Dev event debugger</h2>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events" />
          <div className="career-debug-actions">
            <button type="button" onClick={() => setState({ ...state, age: state.age + 1 })}>Age +1</button>
            <button type="button" onClick={() => setState({ ...state, record: { ...state.record, wins: state.record.wins + 1 } })}>Add win</button>
            <button type="button" onClick={() => setState({ ...state, record: { ...state.record, losses: state.record.losses + 1 } })}>Add loss</button>
            <button type="button" onClick={() => setState({ ...state, ranking: 5, peakRanking: state.peakRanking ?? 5 })}>Set #5</button>
            {(["", "memory", "timing", "circles", "combo", "reflex", "defense", "breathing", "footwork", "clinch"] as const).map((mode) => (
              <button
                className={forcedDrillMode === mode ? "is-debug-active" : ""}
                key={mode || "auto"}
                type="button"
                onClick={() => setForcedDrillMode(mode)}
              >
                {mode || "auto drills"}
              </button>
            ))}
          </div>
          <div className="career-event-list">
            {filteredEvents.map((event) => (
              <button key={event.id} type="button" onClick={() => setForcedEventId(event.id)}>
                <span>{event.type}</span><strong>{event.id}</strong><small>{event.title}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {shopOpen ? (
        <div className="career-shop-modal" role="dialog" aria-modal="true" aria-label="Fighter shop">
          <div className="career-shop-panel">
            <button aria-label="Close shop" className="career-shop-close" type="button" onClick={() => setShopOpen(false)}>x</button>
            <p className="career-sentiment opportunity">shop</p>
            <h2>FIGHTER SHOP</h2>
            <p>Spend career money on recovery, coaching, status symbols and camp tools.</p>
            <div className="career-choice-grid">
              {shopEvent(state).choices.map((choice) => {
                const effects = visibleEffects(shopEvent(state), choice);
                return (
                  <button key={choice.id} className="career-choice" type="button" onClick={() => buyShopItem(choice)}>
                    <strong>{choice.label}</strong>
                    {choice.detail ? <span>{choice.detail}</span> : null}
                    {effects.length ? (
                      <div className="career-choice-effects">
                        {effects.map((effect) => (
                          <em className={effect.rare ? "is-rare" : effect.value < 0 ? "is-negative" : ""} key={effect.key}>
                            {effect.value > 0 ? "+" : ""}{effect.value} {effect.label}
                          </em>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
