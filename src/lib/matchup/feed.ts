export interface FeedSide {
  slug: string;
  name: string;
  imageUrl: string | null;
}

export interface MatchupCardData {
  id: string;
  a: FeedSide;
  b: FeedSide;
  votesA: number;
  votesB: number;
  argumentCount: number;
  lastActivity: number;
}

const text = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;
const count = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
const image = (value: unknown): string | null =>
  typeof value === "string" && value.startsWith("https://") ? value : null;

function millis(value: unknown): number {
  const stamp = value as { toMillis?: () => number } | null | undefined;
  return typeof stamp?.toMillis === "function" ? stamp.toMillis() : 0;
}

/** Returns null for a malformed document, so one bad record cannot break the hub */
export function toCard(
  id: string,
  data: Record<string, unknown>,
): MatchupCardData | null {
  const aSlug = text(data.characterAId);
  const bSlug = text(data.characterBId);
  const aName = text(data.aName);
  const bName = text(data.bName);
  if (!aSlug || !bSlug || !aName || !bName) return null;

  return {
    id,
    a: { slug: aSlug, name: aName, imageUrl: image(data.aImageUrl) },
    b: { slug: bSlug, name: bName, imageUrl: image(data.bImageUrl) },
    votesA: count(data.votesA),
    votesB: count(data.votesB),
    argumentCount: count(data.argumentCount),
    lastActivity: millis(data.lastActivityAt),
  };
}

/** A written argument counts for two votes, since it takes more effort */
export function hotScore(
  card: Pick<MatchupCardData, "votesA" | "votesB" | "argumentCount">,
): number {
  return card.votesA + card.votesB + 2 * card.argumentCount;
}

/** `cards` arrive newest activity first. Hot is by score, recent is the rest in the same order. */
export function splitFeed(
  cards: readonly MatchupCardData[],
  hotLimit = 6,
  recentLimit = 8,
): { hot: MatchupCardData[]; recent: MatchupCardData[] } {
  const hot = cards
    .filter((card) => hotScore(card) > 0)
    .sort((x, y) => hotScore(y) - hotScore(x) || y.lastActivity - x.lastActivity)
    .slice(0, hotLimit);

  const taken = new Set(hot.map((card) => card.id));
  const recent = cards.filter((card) => !taken.has(card.id)).slice(0, recentLimit);

  return { hot, recent };
}
