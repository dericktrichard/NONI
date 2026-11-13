const DAY_MS = 86_400_000;

export function dayNumber(date: Date): number {
  return Math.floor(date.getTime() / DAY_MS);
}

export function currentDay(): number {
  return dayNumber(new Date());
}

/** Two different indexes below `count` for a given day, or null when fewer than two exist */
export function dailyPair(count: number, day: number): [number, number] | null {
  if (count < 2) return null;
  const first = day % count;
  const offset = 1 + ((day * 7 + 3) % (count - 1));
  return [first, (first + offset) % count];
}

/** The day's pair drawn from the first `poolSize` items */
export function pickPair<T>(
  items: readonly T[],
  day: number,
  poolSize = 12,
): [T, T] | null {
  const pool = items.slice(0, poolSize);
  const pair = dailyPair(pool.length, day);
  const first = pair ? pool[pair[0]] : undefined;
  const second = pair ? pool[pair[1]] : undefined;
  return first !== undefined && second !== undefined ? [first, second] : null;
}
