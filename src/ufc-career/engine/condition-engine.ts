import type { EventCondition, FighterCareerState } from "../types";

export function getStateValue(state: FighterCareerState, field: string): unknown {
  return field.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, state);
}

export function matchesCondition(state: FighterCareerState, condition?: EventCondition): boolean {
  if (!condition) return true;
  if ("all" in condition) return condition.all.every((item) => matchesCondition(state, item));
  if ("any" in condition) return condition.any.some((item) => matchesCondition(state, item));
  if ("not" in condition) return !matchesCondition(state, condition.not);

  const actual = getStateValue(state, condition.field);
  const expected = condition.value;

  switch (condition.operator) {
    case "==":
      return actual === expected;
    case "!=":
      return actual !== expected;
    case ">=":
      return Number(actual) >= Number(expected);
    case "<=":
      return Number(actual) <= Number(expected);
    case ">":
      return Number(actual) > Number(expected);
    case "<":
      return Number(actual) < Number(expected);
    case "includes":
      return Array.isArray(actual) ? actual.includes(expected) : String(actual).includes(String(expected));
    case "excludes":
      return Array.isArray(actual) ? !actual.includes(expected) : !String(actual).includes(String(expected));
    case "exists":
      return actual !== undefined && actual !== null;
    default:
      return false;
  }
}
