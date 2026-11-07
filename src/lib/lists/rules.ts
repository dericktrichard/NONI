export const MAX_LISTS = 5;
export const MIN_ITEMS = 1;
export const MAX_ITEMS = 10;
export const TITLE_MIN = 3;
export const TITLE_MAX = 60;
export const REASON_MIN = 3;
export const REASON_MAX = 200;

export const VISIBILITIES = ["public", "private"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

/** Lists saved before the switch existed have no value and stay public */
export function visibilityOf(value: unknown): Visibility {
  return value === "private" ? "private" : "public";
}

export function hasDuplicates(ids: readonly string[]): boolean {
  return new Set(ids).size !== ids.length;
}

export function withoutCharacter<T extends { characterId: string }>(items: readonly T[], characterId: string): T[] {
  return items.filter((item) => item.characterId !== characterId);
}