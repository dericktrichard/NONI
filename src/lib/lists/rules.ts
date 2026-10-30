export const MAX_LISTS = 5;
export const MIN_ITEMS = 1;
export const MAX_ITEMS = 10;
export const TITLE_MIN = 3;
export const TITLE_MAX = 60;
export const REASON_MIN = 3;
export const REASON_MAX = 200;

export function hasDuplicates(ids: readonly string[]): boolean {
  return new Set(ids).size !== ids.length;
}