import type { MediaType } from "@/types/character";

export const MEDIUM_LABEL: Record<MediaType, string> = {
  anime: "Anime",
  manga: "Manga",
  comic: "Comics",
  novel: "Novel",
  manhwa: "Manhwa",
  manhua: "Manhua",
  donghua: "Donghua",
  "live-action": "Live-action",
};

interface Keyed {
  id: string;
  entity?: string | null;
}

export function versionLabel(media: MediaType, continuity?: string | null): string {
  const extra = continuity?.trim();
  return extra ? `${MEDIUM_LABEL[media]}, ${extra}` : MEDIUM_LABEL[media];
}

/** Versions of one character share an entity. Everything else is its own entity. */
export const entityKey = (item: Keyed): string => item.entity || item.id;

/** Rank-ordered items in, the best version of each entity out, order kept */
export function bestPerEntity<T extends Keyed & { score: number }>(
  items: readonly T[],
): T[] {
  const best = new Map<string, T>();
  for (const item of items) {
    const key = entityKey(item);
    const current = best.get(key);
    if (!current || item.score > current.score) best.set(key, item);
  }
  return items.filter((item) => best.get(entityKey(item)) === item);
}

/** Puts versions of the same entity next to each other, at the first one's position */
export function groupVersions<T extends Keyed>(items: readonly T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = entityKey(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.values()].flat();
}

/** Entities that appear more than once in the list */
export function sharedEntities(items: readonly Keyed[]): Set<string> {
  const seen = new Set<string>();
  const shared = new Set<string>();
  for (const item of items) {
    const key = entityKey(item);
    if (seen.has(key)) shared.add(key);
    seen.add(key);
  }
  return shared;
}

export function hasDuplicateEntity(keys: readonly string[]): boolean {
  return new Set(keys).size !== keys.length;
}
