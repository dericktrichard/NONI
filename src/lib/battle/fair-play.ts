/** Every number of the anti-farming rules. Days are UTC days. */
export const FAIR = {
  practice: { win: 1, dailyCap: 10 },
  staked: { perDay: 2, netWinCap: 150 },
  fan: { perCharacterDay: 12 },
  climb: { perRound: 1, title: { 8: 10, 16: 20 }, runsPerDay: 2 },
} as const;

const side = (team: readonly string[]) => [...team].sort().join(",");

/** The same matchup whichever side each team was placed on */
export const matchupKey = (a: readonly string[], b: readonly string[]) =>
  [side(a), side(b)].sort().join("|");

export const climbKey = (hero: string, size: number) => `${hero}:${size}`;

export const isRepeat = (seen: readonly string[], key: string) => seen.includes(key);

/** Free practice never costs Glaze. A fresh win pays a little, up to a daily cap. */
export function practiceReward(input: {
  won: boolean;
  repeat: boolean;
  earnedToday: number;
}): number {
  if (!input.won || input.repeat) return 0;
  return Math.max(
    0,
    Math.min(FAIR.practice.win, FAIR.practice.dailyCap - input.earnedToday),
  );
}

/** A stake is only allowed on a fresh matchup and only for the first matches of the day */
export function mayStake(input: {
  stake: number;
  stakedToday: number;
  repeat: boolean;
}): boolean {
  if (input.stake === 0) return true;
  return !input.repeat && input.stakedToday < FAIR.staked.perDay;
}

/** Losses are never reduced. Wins stop once the day's net winnings reach the cap. */
export function capNetWin(input: { delta: number; netToday: number }): number {
  if (input.delta <= 0) return input.delta;
  return Math.min(input.delta, Math.max(0, FAIR.staked.netWinCap - input.netToday));
}

export function fanPoints(input: {
  wanted: number;
  earnedToday: number;
  repeat: boolean;
}): number {
  if (input.repeat) return 0;
  return Math.max(
    0,
    Math.min(input.wanted, FAIR.fan.perCharacterDay - input.earnedToday),
  );
}

/** Tournament reward by placement. Repeats and runs past the daily limit pay nothing. */
export function climbReward(input: {
  wins: number;
  size: number;
  champion: boolean;
  repeat: boolean;
  runsToday: number;
}): number {
  if (input.repeat || input.runsToday >= FAIR.climb.runsPerDay) return 0;
  const title = FAIR.climb.title[input.size as 8 | 16] ?? 0;
  return input.wins * FAIR.climb.perRound + (input.champion ? title : 0);
}
