// Mirror of the recompute_points() SQL function, for client-side display.
// 3 = exact score, 2 = correct goal difference, 1 = correct outcome, 0 = miss.

export function scorePrediction(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): 0 | 1 | 2 | 3 {
  if (predHome === actualHome && predAway === actualAway) return 3;
  if (predHome - predAway === actualHome - actualAway) return 2;
  if (Math.sign(predHome - predAway) === Math.sign(actualHome - actualAway)) return 1;
  return 0;
}

export const POINTS_LABEL: Record<number, string> = {
  3: "Exact score",
  2: "Goal difference",
  1: "Correct winner",
  0: "Missed",
};

export const POINTS_COLOR: Record<number, string> = {
  3: "bg-green-600 text-white",
  2: "bg-emerald-400 text-emerald-950",
  1: "bg-yellow-300 text-yellow-900",
  0: "bg-gray-200 text-gray-500",
};
