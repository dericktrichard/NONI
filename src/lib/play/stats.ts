export interface DailyResult {
  day: string;
  answers: boolean[];
}

export interface PlayStats {
  bestStreak: number;
  dailyStreak: number;
  lastDay: string | null;
  daily: DailyResult | null;
}

export const EMPTY_STATS: PlayStats = {
  bestStreak: 0,
  dailyStreak: 0,
  lastDay: null,
  daily: null,
};

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const count = (value: unknown): number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100_000
    ? value
    : 0;

export function parseStats(raw: string | null): PlayStats {
  if (!raw) return EMPTY_STATS;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const daily = data.daily as { day?: unknown; answers?: unknown } | null | undefined;
    const validDaily =
      daily &&
      typeof daily.day === "string" &&
      DAY_RE.test(daily.day) &&
      Array.isArray(daily.answers) &&
      daily.answers.length <= 20 &&
      daily.answers.every((answer) => typeof answer === "boolean")
        ? { day: daily.day, answers: daily.answers as boolean[] }
        : null;

    return {
      bestStreak: count(data.bestStreak),
      dailyStreak: count(data.dailyStreak),
      lastDay:
        typeof data.lastDay === "string" && DAY_RE.test(data.lastDay)
          ? data.lastDay
          : null,
      daily: validDaily,
    };
  } catch {
    return EMPTY_STATS;
  }
}

export function previousDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function afterDaily(
  stats: PlayStats,
  day: string,
  answers: boolean[],
  yesterday: string,
): PlayStats {
  if (stats.lastDay === day) return stats;
  const dailyStreak = stats.lastDay === yesterday ? stats.dailyStreak + 1 : 1;
  return { ...stats, dailyStreak, lastDay: day, daily: { day, answers } };
}

export function afterEndless(stats: PlayStats, streak: number): PlayStats {
  return streak > stats.bestStreak ? { ...stats, bestStreak: streak } : stats;
}

/** A streak is only alive if you played today or yesterday */
export function liveDailyStreak(
  stats: PlayStats,
  day: string,
  yesterday: string,
): number {
  return stats.lastDay === day || stats.lastDay === yesterday ? stats.dailyStreak : 0;
}
