/** Glaze economy numbers and the pure rules around them. Server and screens share this file. */
export const GLAZE = {
  /** Every account starts here */
  start: 100,
  /** Most Glaze one account can earn from free play in a UTC day */
  dailyEarnCap: 150,
  /** Amounts a player may put at risk. 0 is free play. */
  stakes: [0, 10, 25, 50],
  /** Share of fair odds paid on a won stake. The rest is the house edge, which drains Glaze over time. */
  house: 0.9,
  maxPayout: 4,
  clash: { win: 8, loss: 2, perSurvivor: 1, underdogMin: 0.5, underdogMax: 2 },
  /** Free play reward factors, and for stakes the payout curve with a scale per kind of bracket (tuned so the average stake loses about a tenth) */
  climb: { perRound: 4, champion: 20, participation: 1, hardBonus: 1.3, randomPenalty: 0.8, curve: 2, scale: { fair: 0.78, hard: 1.35, random: 1.05 } },
} as const;

export type Stake = (typeof GLAZE.stakes)[number];
export type ClimbMode = "counters" | "random";
export type Strength = "fair" | "hard";
export type Outcome = "win" | "loss" | "draw";

export const isStake = (value: number): boolean => (GLAZE.stakes as readonly number[]).includes(value);
export const dayKey = (date: Date): string => date.toISOString().slice(0, 10);

/** Reward multiplier from the player's own win chance. Beating the odds pays more, farming weak teams pays less. */
export function underdogFactor(edge: number): number {
  const raw = 1 + (0.5 - edge) * 2;
  return Math.min(GLAZE.clash.underdogMax, Math.max(GLAZE.clash.underdogMin, raw));
}

/** Net gain on a won stake, as a multiple of the stake. Long odds pay more. */
export function stakeMultiplier(chance: number): number {
  return Math.min(GLAZE.maxPayout, (GLAZE.house * (1 - chance)) / Math.max(chance, 0.01));
}

/** How much of a free-play reward still fits under today's cap */
export function grantable(earnedToday: number, amount: number): number {
  return Math.max(0, Math.min(amount, GLAZE.dailyEarnCap - earnedToday));
}

export interface Settlement {
  /** Change to the balance. Negative when a stake is lost. */
  delta: number;
  /** Free-play reward, subject to the daily cap */
  earned: boolean;
}

export function clashSettlement(input: { stake: number; outcome: Outcome; chance: number; survivors: number; edge: number }): Settlement {
  if (input.stake > 0) {
    const delta = input.outcome === "win" ? Math.round(input.stake * stakeMultiplier(input.chance)) : input.outcome === "loss" ? -input.stake : 0;
    return { delta, earned: false };
  }
  const { win, loss, perSurvivor } = GLAZE.clash;
  const base = input.outcome === "win" ? win + input.survivors * perSurvivor : loss;
  return { delta: Math.max(1, Math.round(base * underdogFactor(input.edge))), earned: true };
}

/** Net result of a climb as a multiple of the stake: -1 for an early exit, a big win for the title */
export function climbNet(wins: number, rounds: number, mode: ClimbMode, strength: Strength): number {
  const { curve, scale } = GLAZE.climb;
  const size = Math.sqrt(rounds / 3);
  return -1 + (wins / rounds) ** curve * (rounds + 1) * size * (mode === "random" ? scale.random : scale[strength]);
}

export function climbSettlement(input: { stake: number; wins: number; rounds: number; mode: ClimbMode; strength: Strength }): Settlement {
  if (input.stake > 0) {
    return { delta: Math.round(input.stake * climbNet(input.wins, input.rounds, input.mode, input.strength)), earned: false };
  }
  const { perRound, champion, participation, hardBonus, randomPenalty } = GLAZE.climb;
  const base = input.wins * perRound + (input.wins >= input.rounds ? champion : 0) + participation;
  const factor = input.mode === "random" ? randomPenalty : input.strength === "hard" ? hardBonus : 1;
  return { delta: Math.max(1, Math.round(base * factor)), earned: true };
}