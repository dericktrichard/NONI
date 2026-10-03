/**
 * "Gojo Satoru" produces go, goj, gojo, sa, sat, sato, sator, satoru.
 * Query with where("searchKeys", "array-contains", term.toLowerCase()).
 * Latin scripts only for now. Native-script names (CJK) come later.
 */
export function buildSearchKeys(names: string[], maxPrefix = 12): string[] {
  const keys = new Set<string>();

  for (const name of names) {
    const normalized = name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ");

    for (const word of normalized.split(/\s+/).filter(Boolean)) {
      for (let i = 2; i <= Math.min(word.length, maxPrefix); i++) {
        keys.add(word.slice(0, i));
      }
    }
  }

  return [...keys];
}