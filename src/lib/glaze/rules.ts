/** Glaze economy numbers and the pure rules around them. Server and screens share this file. */
export const GLAZE = {
  /** Every account starts here, as earned Glaze */
  start: 100,
  /** Amounts a player may put at risk. 0 is practice play, which pays no Glaze. */
  stakes: [0, 10, 25, 50],
  /** Share of fair odds paid on a won stake. The rest is the house edge, which drains Glaze over time. */
  house: 0.9,
  maxPayout: 4,
  /** Daily claim: base on day one, plus a bonus for every extra streak day up to maxStreak */
  claim: { base: 20, bonus: 5, maxStreak: 7, minAgeMs: 24 * 60 * 60 * 1000 },
  /** Payout curve for climb stakes, with a scale per kind of bracket (tuned so the average stake loses about a tenth) */
  climb: { curve: 2, scale: { fair: 0.78, hard: 1.35, random: 1.05 } },
} as const;

export type Stake = (typeof GLAZE.stakes)[number];
export type ClimbMode = "counters" | "random";
export type Strength = "fair" | "hard";
export type Outcome = "win" | "loss" | "draw";

const DAY_MS = 24 * 60 * 60 * 1000;

export const isStake = (value: number): boolean =>
  (GLAZE.stakes as readonly number[]).includes(value);
export const dayKey = (date: Date): string => date.toISOString().slice(0, 10);
export const yesterdayKey = (today: string): string =>
  dayKey(new Date(Date.parse(`${today}T00:00:00Z`) - DAY_MS));

/** Net gain on a won stake, as a multiple of the stake. Long odds pay more. */
export function stakeMultiplier(chance: number): number {
  return Math.min(GLAZE.maxPayout, (GLAZE.house * (1 - chance)) / Math.max(chance, 0.01));
}

export interface Settlement {
  /** Change to the earned balance. Negative when a stake is lost, zero for practice play. */
  delta: number;
}

export function clashSettlement(input: {
  stake: number;
  outcome: Outcome;
  chance: number;
}): Settlement {
  if (input.stake === 0) return { delta: 0 };
  const delta =
    input.outcome === "win"
      ? Math.round(input.stake * stakeMultiplier(input.chance))
      : input.outcome === "loss"
        ? -input.stake
        : 0;
  return { delta };
}

/** Net result of a climb as a multiple of the stake: -1 for an early exit, a big win for the title */
export function climbNet(
  wins: number,
  rounds: number,
  mode: ClimbMode,
  strength: Strength,
): number {
  const { curve, scale } = GLAZE.climb;
  const size = Math.sqrt(rounds / 3);
  return (
    -1 +
    (wins / rounds) ** curve *
      (rounds + 1) *
      size *
      (mode === "random" ? scale.random : scale[strength])
  );
}

export function climbSettlement(input: {
  stake: number;
  wins: number;
  rounds: number;
  mode: ClimbMode;
  strength: Strength;
}): Settlement {
  if (input.stake === 0) return { delta: 0 };
  return {
    delta: Math.round(
      input.stake * climbNet(input.wins, input.rounds, input.mode, input.strength),
    ),
  };
}

/** Streak day the next claim counts as: it continues after a claim yesterday and restarts after a gap */
export function nextStreak(
  lastDay: string | null,
  today: string,
  streak: number,
): number {
  const max = GLAZE.claim.maxStreak;
  if (lastDay === today) return Math.max(1, Math.min(streak, max));
  if (lastDay === yesterdayKey(today)) return Math.min(Math.max(streak, 0) + 1, max);
  return 1;
}

export function claimAmount(streak: number): number {
  const { base, bonus, maxStreak } = GLAZE.claim;
  return base + bonus * (Math.min(Math.max(streak, 1), maxStreak) - 1);
}

/** Spending uses bought Glaze first, then earned. Null when the amount is invalid or more than the player has. */
export function splitSpend(
  earned: number,
  bought: number,
  amount: number,
): { bought: number; earned: number } | null {
  if (!Number.isInteger(amount) || amount <= 0 || amount > earned + bought) return null;
  const fromBought = Math.min(bought, amount);
  return { bought: fromBought, earned: amount - fromBought };
}
