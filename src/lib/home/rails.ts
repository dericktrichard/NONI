import { MEDIA_LABELS } from "@/config/media";
import { exploreHref } from "@/lib/explore/params";
import type { CharacterSummary, MediaType } from "@/types/character";

export interface RailItem {
  c: CharacterSummary;
  position: number;
}

export interface Rail {
  id: string;
  eyebrow: string;
  title: string;
  href: string;
  items: RailItem[];
}

interface RailOptions {
  limit?: number;
  minPerMedium?: number;
  /** Each medium's own best characters in rank order. Positions then count within the medium. */
  media?: Partial<Record<MediaType, readonly CharacterSummary[]>>;
}

/** `pool` must be in rank order starting at rank 1, so an item's index is its global position */
export function buildRails(
  pool: readonly CharacterSummary[],
  options: RailOptions = {},
): Rail[] {
  const limit = options.limit ?? 12;
  const minPerMedium = options.minPerMedium ?? 2;
  const ranked: RailItem[] = pool.map((c, index) => ({ c, position: index + 1 }));
  if (ranked.length === 0) return [];

  const mediaRail = (type: MediaType, items: RailItem[]): Rail => ({
    id: `media-${type}`,
    eyebrow: "By medium",
    title: MEDIA_LABELS[type],
    href: exploreHref({ media: type }),
    items: items.slice(0, limit),
  });

  let mediaRails: Rail[];
  if (options.media) {
    mediaRails = (
      Object.entries(options.media) as [MediaType, readonly CharacterSummary[]][]
    )
      .filter(([, list]) => list.length >= minPerMedium)
      .sort(([, a], [, b]) => (b[0]?.score ?? 0) - (a[0]?.score ?? 0))
      .map(([type, list]) =>
        mediaRail(
          type,
          list.map((c, index) => ({ c, position: index + 1 })),
        ),
      );
  } else {
    const byMedia = new Map<MediaType, RailItem[]>();
    for (const item of ranked) {
      const list = byMedia.get(item.c.media);
      if (list) list.push(item);
      else byMedia.set(item.c.media, [item]);
    }
    mediaRails = [...byMedia.entries()]
      .filter(([, items]) => items.length >= minPerMedium)
      .sort(([, a], [, b]) => (a[0]?.position ?? 0) - (b[0]?.position ?? 0))
      .map(([type, items]) => mediaRail(type, items));
  }

  return [
    {
      id: "top",
      eyebrow: "Overall",
      title: "Top ranked",
      href: exploreHref({ all: true }),
      items: ranked.slice(0, limit),
    },
    ...mediaRails,
  ];
}
