/** Slugs are lowercase words joined by single hyphens, so "_vs_" can never occur inside one */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const COL = {
  characters: "characters",
  feats: "feats",
  votes: "votes",
  matchups: "matchups",
  arguments: "arguments",
  users: "users",
  creators: "creators",
  verses: "verses",
  handles: "handles",
  rateLimits: "_rateLimits",
} as const;

/** Canonical matchup ID: the same pair always maps to the same document */
export function matchupId(a: string, b: string): string {
  if (!SLUG_RE.test(a) || !SLUG_RE.test(b)) throw new Error("Invalid character slug");
  if (a === b) throw new Error("A character cannot face itself");
  const [first, second] = a < b ? [a, b] : [b, a];
  return `${first}_vs_${second}`;
}