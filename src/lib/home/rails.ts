import { MEDIA_LABELS } from "@/config/media";
import type { CharacterSummary, MediaType } from "@/types/character";

export interface RailItem {
  c: CharacterSummary;
  position: number;
}

export interface Rail {
  id: string;
  eyebrow: string;
  title: string;
  items: RailItem[];
}

interface RailOptions {
  limit?: number;
  minPerMedium?: number;
}

/** `pool` must be in rank order starting at rank 1, so an item's index is its global position */
export function buildRails(pool: readonly CharacterSummary[], options: RailOptions = {}): Rail[] {
  const limit = options.limit ?? 12;
  const minPerMedium = options.minPerMedium ?? 2;

  const ranked: RailItem[] = pool.map((c, index) => ({ c, position: index + 1 }));
  if (ranked.length === 0) return [];

  const byMedia = new Map<MediaType, RailItem[]>();
  for (const item of ranked) {
    const list = byMedia.get(item.c.media);
    if (list) list.push(item);
    else byMedia.set(item.c.media, [item]);
  }

  const mediaRails: Rail[] = [...byMedia.entries()]
    .filter(([, items]) => items.length >= minPerMedium)
    .sort(([, a], [, b]) => (a[0]?.position ?? 0) - (b[0]?.position ?? 0))
    .map(([type, items]) => ({
      id: `media-${type}`,
      eyebrow: "By medium",
      title: MEDIA_LABELS[type],
      items: items.slice(0, limit),
    }));

  return [{ id: "top", eyebrow: "Overall", title: "Top ranked", items: ranked.slice(0, limit) }, ...mediaRails];
}