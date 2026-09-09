import type { CareerStage, FighterCareerState } from "../types";

export function getWinStreak(state: FighterCareerState) {
  let streak = 0;
  for (const item of [...state.history].reverse()) {
    if (item.type !== "fight") continue;
    if (item.detail.startsWith("WIN")) streak += 1;
    else break;
  }
  return streak;
}

export function getCareerStage(state: FighterCareerState): CareerStage {
  if (state.defenses >= 5 || state.record.wins >= 25) return "LEGEND";
  if (state.flags.isChampion) return "CHAMPION";
  if (state.ranking && state.ranking <= 3) return "TITLE CONTENDER";
  if (state.ranking && state.ranking <= 5) return "TOP 5";
  if (state.ranking && state.ranking <= 10) return "TOP 10";
  if (state.ranking && state.ranking <= 15) return "RANKED CONTENDER";
  if (state.record.wins >= 6 && state.organization !== "Regional") return "RISING PROSPECT";
  if (state.record.wins >= 3) return "PROFESSIONAL";
  if (state.record.wins >= 1) return "REGIONAL PROSPECT";
  return "AMATEUR";
}

export function scoreCareer(state: FighterCareerState) {
  const finishes = state.record.koWins + state.record.submissionWins;
  const titleScore = state.titles.length * 1400 + state.defenses * 420;
  const rankingScore = state.peakRanking ? Math.max(0, 900 - state.peakRanking * 45) : 0;
  const streakScore = getWinStreak(state) * 120;
  const score =
    state.record.wins * 180 -
    state.record.losses * 90 +
    finishes * 130 +
    titleScore +
    rankingScore +
    streakScore +
    state.popularity * 8 +
    state.reputation * 7 +
    (state.flags.doubleChampion ? 1200 : 0);

  const legacyScore = Math.max(0, Math.round(score));
  const legacyRank =
    legacyScore >= 9000
      ? "GOAT"
      : legacyScore >= 7600
        ? "MMA LEGEND"
        : legacyScore >= 6200
          ? "DOMINANT CHAMPION"
          : legacyScore >= 4700
            ? "CHAMPION"
            : legacyScore >= 3300
              ? "FAN FAVORITE"
              : legacyScore >= 2200
                ? "CONTENDER"
                : legacyScore >= 1100
                  ? "JOURNEYMAN"
                  : "FORGOTTEN PROSPECT";

  return { legacyScore, legacyRank };
}
