export const MAX_CITATIONS = 3;
export const CITABLE_STATUS = "verified";

export interface CitationInput {
  characterId: string;
  featId: string;
}

export type CitationIssue = "wrong_character" | "duplicate" | "missing" | "unverified";

export const CITATION_MESSAGES: Record<CitationIssue, string> = {
  wrong_character: "Cite feats from the two characters in this matchup.",
  duplicate: "Each feat can be cited once.",
  missing: "One of the cited feats could not be found.",
  unverified: "Only verified feats can be cited.",
};

export interface FoundFeat {
  exists: boolean;
  status?: unknown;
}

export function checkCitationScope(
  citations: readonly CitationInput[],
  pair: readonly [string, string],
): CitationIssue | null {
  const seen = new Set<string>();
  for (const citation of citations) {
    if (citation.characterId !== pair[0] && citation.characterId !== pair[1]) return "wrong_character";
    const key = `${citation.characterId}/${citation.featId}`;
    if (seen.has(key)) return "duplicate";
    seen.add(key);
  }
  return null;
}

export function checkCitedFeats(found: readonly FoundFeat[]): CitationIssue | null {
  for (const feat of found) {
    if (!feat.exists) return "missing";
    if (feat.status !== CITABLE_STATUS) return "unverified";
  }
  return null;
}