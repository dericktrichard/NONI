import { isMediaType } from "@/config/media";
import { evidenceShare } from "@/lib/ranking/score";
import type { CharacterSummary } from "@/types/character";

/** The only fields a list page reads. Smaller responses, same one-read-per-document cost. */
export const SUMMARY_FIELDS = [
  "name",
  "verseName",
  "media",
  "tier",
  "speed",
  "score",
  "rank",
  "previousRank",
  "featCount",
  "verifiedFeatCount",
  "imageUrl",
] as const;

export interface CharacterPage {
  items: CharacterSummary[];
  /** Pass this as `after` to get the next page, or null when this is the last one */
  next: number | null;
}

const text = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/** Returns null for a malformed document, so one bad record cannot break a page */
export function toSummary(id: string, data: Record<string, unknown>): CharacterSummary | null {
  const name = text(data.name);
  const verse = text(data.verseName);
  const tier = text(data.tier);
  const speed = text(data.speed);
  const score = finite(data.score);
  const rank = finite(data.rank);
  if (!name || !verse || !tier || !speed || score === null || rank === null) return null;
  if (!isMediaType(data.media)) return null;

  const previousRank = finite(data.previousRank);
  const featCount = finite(data.featCount) ?? 0;
  const verified = finite(data.verifiedFeatCount) ?? 0;
  const imageUrl =
    typeof data.imageUrl === "string" && data.imageUrl.startsWith("https://") ? data.imageUrl : null;

  return {
    id,
    name,
    verse,
    media: data.media,
    tier,
    speed,
    score,
    trend: previousRank === null ? 0 : previousRank - rank,
    featCount,
    evidence: evidenceShare(verified, featCount),
    imageUrl,
  };
}

/** Rows arrive in rank order with one extra row if another page exists */
export function assemblePage(
  rows: ReadonlyArray<{ id: string; data: Record<string, unknown> }>,
  limit: number,
): CharacterPage {
  const visible = rows.slice(0, limit);

  const items: CharacterSummary[] = [];
  for (const row of visible) {
    const summary = toSummary(row.id, row.data);
    if (summary) items.push(summary);
  }

  const last = visible[visible.length - 1];
  const lastRank = last ? finite(last.data.rank) : null;

  return { items, next: rows.length > limit && lastRank !== null ? lastRank : null };
}
