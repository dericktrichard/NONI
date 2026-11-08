/** Glaze economy numbers and the pure rules around them. Server and screens share this file. */
export const GLAZE = {
  /** Every account starts here */
  start: 100,
  /** Most Glaze one account can earn by playing in a UTC day */
  dailyEarnCap: 150,
  clash: { win: 12, loss: 3, perSurvivor: 2, underdogMin: 0.5, underdogMax: 2 },
  climb: { perRound: 6, champion: 30, participation: 2, hardMultiplier: 1.5, randomMultiplier: 0.8 },
} as const;

export const dayKey = (date: Date): string => date.toISOString().slice(0, 10);

/** Reward multiplier from the player's own win chance. Beating the odds pays more, farming weak teams pays less. */
export function underdogFactor(edge: number): number {
  const raw = 1 + (0.5 - edge) * 2;
  return Math.min(GLAZE.clash.underdogMax, Math.max(GLAZE.clash.underdogMin, raw));
}

export function clashReward(input: { won: boolean; survivors: number; edge: number }): number {
  const base = input.won ? GLAZE.clash.win + input.survivors * GLAZE.clash.perSurvivor : GLAZE.clash.loss;
  return Math.max(1, Math.round(base * underdogFactor(input.edge)));
}

export function climbReward(input: {
  wins: number;
  rounds: number;
  mode: "counters" | "random";
  difficulty: "fair" | "hard";
}): number {
  const champion = input.wins >= input.rounds ? GLAZE.climb.champion : 0;
  const base = input.wins * GLAZE.climb.perRound + champion + GLAZE.climb.participation;
  const factor =
    input.mode === "random" ? GLAZE.climb.randomMultiplier : input.difficulty === "hard" ? GLAZE.climb.hardMultiplier : 1;
  return Math.max(1, Math.round(base * factor));
}

/** How much of a reward still fits under today's cap */
export function grantable(earnedToday: number, amount: number): number {
  return Math.max(0, Math.min(amount, GLAZE.dailyEarnCap - earnedToday));
}