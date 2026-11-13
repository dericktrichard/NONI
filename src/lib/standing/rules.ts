export const FAN = {
  hero: 3,
  team: 1,
  tiers: [
    { at: 100, label: "Superfan" },
    { at: 25, label: "Devotee" },
    { at: 5, label: "Fan" },
  ],
  top: 5,
} as const;

export type BattleKind = "clash" | "climb";

/** Fan points one battle adds, per character. Only the player's own side counts. */
export function fanPoints(
  kind: BattleKind,
  slugs: readonly string[],
): Record<string, number> {
  const each = kind === "climb" ? FAN.hero : FAN.team;
  const points: Record<string, number> = {};
  for (const slug of new Set(slugs)) points[slug] = each;
  return points;
}

export const tierOf = (score: number): string | null =>
  FAN.tiers.find((tier) => score >= tier.at)?.label ?? null;

/** The badge a fan wears for one character, or null when they are not in its top three */
export function fanTitle(name: string, rank: number): string | null {
  return rank === 1
    ? `${name}'s no. 1 fan`
    : rank === 2 || rank === 3
      ? `No. ${rank} fan of ${name}`
      : null;
}

/** Monday of the UTC week, as YYYY-MM-DD */
export function weekKey(date: Date): string {
  const day = (date.getUTCDay() + 6) % 7;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day),
  )
    .toISOString()
    .slice(0, 10);
}

export type Ranked<T> = T & { rank: number };

/** Highest first, equal scores share a rank (1, 1, 3), ties broken by `key` for a stable order */
export function rankRows<T>(
  rows: readonly T[],
  score: (row: T) => number,
  key: (row: T) => string,
): Ranked<T>[] {
  const sorted = [...rows].sort(
    (a, b) => score(b) - score(a) || (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0),
  );
  return sorted.map((row) => ({
    ...row,
    rank: 1 + sorted.filter((other) => score(other) > score(row)).length,
  }));
}
