import { allCareerEvents } from "../data/events/career-events";
import type { EventDefinition, FighterCareerState } from "../types";
import { matchesCondition } from "./condition-engine";
import { createRng } from "./rng";

function lastFightSeason(state: FighterCareerState) {
  return [...state.history].reverse().find((item) => item.type === "fight")?.season ?? -999;
}

function pickWeighted(events: EventDefinition[], rng: ReturnType<typeof createRng>) {
  const total = events.reduce((sum, event) => sum + (event.weight ?? 1), 0);
  let roll = rng.next() * total;
  for (const event of events) {
    roll -= event.weight ?? 1;
    if (roll <= 0) return event;
  }
  return events[0] ?? null;
}

export function validateEvents(events: EventDefinition[] = allCareerEvents) {
  const errors: string[] = [];
  const ids = new Set<string>();
  events.forEach((event) => {
    if (ids.has(event.id)) errors.push(`Duplicate event id: ${event.id}`);
    ids.add(event.id);
    if (!event.choices.length) errors.push(`Event ${event.id} has no choices`);
    event.choices.forEach((choice) => {
      if (choice.nextEventId && !events.some((candidate) => candidate.id === choice.nextEventId)) {
        errors.push(`Event ${event.id} references missing nextEventId ${choice.nextEventId}`);
      }
    });
    if (event.chain?.requiresEvent && !events.some((candidate) => candidate.id === event.chain?.requiresEvent)) {
      errors.push(`Event ${event.id} requires missing event ${event.chain.requiresEvent}`);
    }
  });
  return errors;
}

export function getEligibleEvents(state: FighterCareerState, events: EventDefinition[] = allCareerEvents) {
  return events.filter((event) => {
    const hasFightChoice = event.choices.some((choice) => choice.startsFight);
    const isUrgentFight =
      event.id === "title_shot" ||
      event.id === "title_defense" ||
      event.id === "grand_prix_final" ||
      event.id === "retirement_decision";
    if (hasFightChoice && !isUrgentFight && state.season - lastFightSeason(state) < 3) return false;
    if ((state.eventCooldowns[event.id] ?? 0) > state.season) return false;
    if (state.previousEvents.includes(event.id) && event.cooldown === undefined) return false;
    if (event.chain?.requiresEvent && !state.previousEvents.includes(event.chain.requiresEvent)) return false;
    return matchesCondition(state, event.conditions);
  });
}

export function selectCareerEvent(state: FighterCareerState, events: EventDefinition[] = allCareerEvents) {
  const rng = createRng(`${state.careerSeed}-event-${state.season}`, state.rngStep);
  const allEligible = getEligibleEvents(state, events);
  const mandatoryLifeEvent = allEligible.find((event) => event.id.startsWith("mandatory_life_"));
  const postDefenseChoice = allEligible.find((event) => event.id === "post_defense_division_choice");
  const titleShot = allEligible.find((event) => event.id === "title_shot");
  const titleDefense = allEligible.find((event) => event.id === "title_defense");
  const titleEliminator = allEligible.find((event) => event.id === "title_eliminator");
  if (mandatoryLifeEvent) return mandatoryLifeEvent;
  if (postDefenseChoice) return postDefenseChoice;
  if (titleDefense && rng.next() < 0.82) return titleDefense;
  if (titleShot) return titleShot;
  if (titleEliminator && rng.next() < 0.78) return titleEliminator;
  const fightGap = state.season - lastFightSeason(state);
  const fightEligible = allEligible.filter((event) => event.choices.some((choice) => choice.startsFight));
  if (fightEligible.length && (state.record.wins === 0 || fightGap >= 3) && rng.next() < (state.record.wins === 0 ? 0.95 : 0.72)) {
    return pickWeighted(fightEligible, rng);
  }
  const eligible = allEligible.filter((event) => rng.next() <= (event.probability ?? 1));
  if (!eligible.length && allEligible.length && state.season % 3 === 0) {
    return [...allEligible].sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1))[0];
  }
  if (!eligible.length) return null;
  return pickWeighted(eligible, rng);
}
