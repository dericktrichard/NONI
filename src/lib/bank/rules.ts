export const BANK = {
  /** Amounts a player may contribute to a character's bank */
  amounts: [10, 50, 100, 500],
  /** Contributors named on a character page */
  named: 3,
} as const;

export const isAmount = (value: number): boolean =>
  (BANK.amounts as readonly number[]).includes(value);

/** This week's bank total after a contribution. A new week starts from zero. */
export function weekTotalAfter(
  stored: { weekKey: unknown; weekTotal: unknown },
  week: string,
  amount: number,
): number {
  const current = stored.weekKey === week ? Number(stored.weekTotal) || 0 : 0;
  return current + amount;
}
