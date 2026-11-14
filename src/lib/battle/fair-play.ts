import { PLUS } from "@/lib/plus/rules";
import { fanPoints as wantedPoints, type BattleKind } from "@/lib/standing/rules";

/** Every number of the anti-farming rules. Days are UTC days. */
export const FAIR = {
  practice: { win: 1, dailyCap: 10 },
  staked: { perDay: 2, netWinCap: 150 },
  fan: { perCharacterDay: 12 },
  climb: { perRound: 1, title: { 8: 10, 16: 20 }, runsPerDay: 2 },
} as const;

/** The daily numbers that depend on Plus. The winnings cap and fan caps are the same for everyone. */
export interface Limits {
  practiceCap: number;
  stakesPerDay: number;
  climbRuns: number;
}

export const limitsFor = (plus: boolean): Limits =>
  plus
    ? PLUS.limits
    : {
        practiceCap: FAIR.practice.dailyCap,
        stakesPerDay: FAIR.staked.perDay,
        climbRuns: FAIR.climb.runsPerDay,
      };

export interface Daily {
  matches: number;
  staked: number;
  /** Net Glaze from staked matches today */
  net: number;
  /** Glaze earned from practice wins today */
  practice: number;
  climbRuns: number;
  matchups: string[];
  climbs: string[];
  /** Fan points granted today, per character */
  fan: Record<string, number>;
}

export const EMPTY_DAILY: Daily = {
  matches: 0,
  staked: 0,
  net: 0,
  practice: 0,
  climbRuns: 0,
  matchups: [],
  climbs: [],
  fan: {},
};

/** What the screens need to know about today */
export interface Today {
  /** After the first match of the day the matchmaker chooses the opponent */
  matchmade: boolean;
  stakesLeft: number;
  practiceLeft: number;
  winsLeft: number;
  climbRunsLeft: number;
  /** Set by `todayFor`: whether Plus is active and the limits that apply */
  plus?: boolean;
  limits?: Limits;
}

export const todayOf = (daily: Daily, plus = false): Today => {
  const limits = limitsFor(plus);
  return {
    matchmade: daily.matches > 0,
    stakesLeft: Math.max(0, limits.stakesPerDay - daily.staked),
    practiceLeft: Math.max(0, limits.practiceCap - daily.practice),
    winsLeft: Math.max(0, FAIR.staked.netWinCap - daily.net),
    climbRunsLeft: Math.max(0, limits.climbRuns - daily.climbRuns),
  };
};

/** `todayOf` plus the limits in force, for the screens */
export const todayFor = (daily: Daily, plus: boolean): Today => ({
  ...todayOf(daily, plus),
  plus,
  limits: limitsFor(plus),
});

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
  plus?: boolean;
}): number {
  if (!input.won || input.repeat) return 0;
  const cap = limitsFor(input.plus ?? false).practiceCap;
  return Math.max(0, Math.min(FAIR.practice.win, cap - input.earnedToday));
}

/** A stake is only allowed on a fresh matchup and only for the first matches of the day */
export function mayStake(input: {
  stake: number;
  stakedToday: number;
  repeat: boolean;
  plus?: boolean;
}): boolean {
  if (input.stake === 0) return true;
  return !input.repeat && input.stakedToday < limitsFor(input.plus ?? false).stakesPerDay;
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

/** Fan points a battle may add per character, after today's per-character cap */
export function fanGrant(
  kind: BattleKind,
  slugs: readonly string[],
  used: Readonly<Record<string, number>>,
): Record<string, number> {
  const granted: Record<string, number> = {};
  for (const [slug, wanted] of Object.entries(wantedPoints(kind, slugs))) {
    granted[slug] = fanPoints({ wanted, earnedToday: used[slug] ?? 0, repeat: false });
  }
  return granted;
}

/** Tournament reward by placement. Repeats and runs past the daily limit pay nothing. */
export function climbReward(input: {
  wins: number;
  size: number;
  champion: boolean;
  repeat: boolean;
  runsToday: number;
  plus?: boolean;
}): number {
  if (input.repeat || input.runsToday >= limitsFor(input.plus ?? false).climbRuns)
    return 0;
  const title = FAIR.climb.title[input.size as 8 | 16] ?? 0;
  return input.wins * FAIR.climb.perRound + (input.champion ? title : 0);
}
