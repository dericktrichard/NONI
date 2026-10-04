/** Share of a character's feats that are verified, for the evidence meter */
export function evidenceShare(verifiedFeatCount: number, featCount: number): number {
  if (featCount <= 0) return 0;
  return Math.min(1, Math.max(0, verifiedFeatCount / featCount));
}

export interface Rankable {
  slug: string;
  name: string;
  score: number;
  verifiedFeatCount: number;
}

// Plain code-unit comparison, so the order never depends on locale or ICU data
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Score, then verified feats, then name, then slug (unique, so the order is total) */
export function compareCharacters(a: Rankable, b: Rankable): number {
  return (
    b.score - a.score ||
    b.verifiedFeatCount - a.verifiedFeatCount ||
    cmp(a.name.toLowerCase(), b.name.toLowerCase()) ||
    cmp(a.slug, b.slug)
  );
}
