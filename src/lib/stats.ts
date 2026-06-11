import type { MatchStats } from "./types";

// Group-prediction aggregates, computed in app code so they're available
// immediately (no kickoff gate — the group sees everything from the start).
export function computeStats(
  picks: { home_score: number; away_score: number }[]
): MatchStats | null {
  const total = picks.length;
  if (total === 0) return null;

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let sumHome = 0;
  let sumAway = 0;
  const counts = new Map<string, number>();

  for (const p of picks) {
    if (p.home_score > p.away_score) homeWins++;
    else if (p.home_score === p.away_score) draws++;
    else awayWins++;
    sumHome += p.home_score;
    sumAway += p.away_score;
    const key = `${p.home_score}-${p.away_score}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let topScore = "";
  let topCount = 0;
  for (const [key, count] of counts) {
    if (count > topCount || (count === topCount && key < topScore)) {
      topScore = key;
      topCount = count;
    }
  }

  const pct = (n: number) => Math.round((100 * n) / total);
  const round2 = (n: number) => Math.round((n / total) * 100) / 100;

  return {
    total,
    avg_home: round2(sumHome),
    avg_away: round2(sumAway),
    home_win_pct: pct(homeWins),
    draw_pct: pct(draws),
    away_win_pct: pct(awayWins),
    top_score: topScore,
    top_score_pct: pct(topCount),
  };
}
