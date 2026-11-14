export const PLUS = {
  /** Spend-only Glaze added once, when Plus first starts */
  welcomeBought: 1000,
  homeBanner: { price: 1000, days: 30 },
  /** Daily limits while Plus is active. The daily winnings cap is the same for everyone. */
  limits: { practiceCap: 15, stakesPerDay: 3, climbRuns: 3 },
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/** True while an expiry time (in ms) is still in the future */
export const isActive = (until: unknown, now: number): until is number =>
  typeof until === "number" && until > now;

/** The new expiry after adding days. Time left on an active period is kept. */
export function extendUntil(current: unknown, now: number, days: number): number {
  const base = isActive(current, now) ? current : now;
  return base + days * DAY_MS;
}
