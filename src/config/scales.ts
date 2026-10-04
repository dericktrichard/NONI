/**
 * Power scales used by the combat engine.
 *
 * Names and ordering follow the community Tiering System and Speed scale
 * documented on the VS Battles Wiki (community content, CC BY-SA). The
 * descriptions here are our own wording. Add attribution on the About page.
 *
 * Everything is data. To add or reorder a rung, edit these lists and nothing else.
 */

export interface ApTier {
  /** The wiki code, e.g. "7-B" or "High 6-A". Used as the stored value. */
  id: string;
  label: string;
  /** Wiki tier number: 11 down to 0. Used for grouping in the UI. */
  group: number;
  /** Dimensionality a character at this tier is assumed to operate in */
  dimension: number;
}

export const TIER_GROUPS: Record<number, string> = {
  11: "Infinitesimal",
  10: "Human",
  9: "Superhuman",
  8: "Urban",
  7: "Nuclear",
  6: "Tectonic",
  5: "Planetary",
  4: "Stellar",
  3: "Cosmic",
  2: "Multiversal",
  1: "Extradimensional",
  0: "Boundless",
};

/**
 * Dimension numbers are an ordinal encoding of the wiki's mapping:
 * 4 for Tier 2, 5 for Low 1-C, 7 for 1-C, 10 for High 1-C, 12 for 1-B,
 * 13 for a countably infinite number of dimensions, and 14 to 17 for the
 * uncountable levels. Real characters are 3 unless a tier or a feat says more.
 */
export const MIN_DIMENSION = 3;
export const MAX_DIMENSION = 17;

const rows: Array<[id: string, label: string, dimension?: number]> = [
  ["11-C", "Low Hypoverse level"],
  ["11-B", "Hypoverse level"],
  ["11-A", "High Hypoverse level"],
  ["10-C", "Below Average Human level"],
  ["10-B", "Human level"],
  ["10-A", "Athlete level"],
  ["9-C", "Street level"],
  ["9-B", "Wall level"],
  ["9-A", "Small Building level"],
  ["8-C", "Building level"],
  ["High 8-C", "Large Building level"],
  ["8-B", "City Block level"],
  ["8-A", "Multi-City Block level"],
  ["Low 7-C", "Small Town level"],
  ["7-C", "Town level"],
  ["High 7-C", "Large Town level"],
  ["Low 7-B", "Small City level"],
  ["7-B", "City level"],
  ["7-A", "Mountain level"],
  ["High 7-A", "Large Mountain level"],
  ["6-C", "Island level"],
  ["High 6-C", "Large Island level"],
  ["Low 6-B", "Small Country level"],
  ["6-B", "Country level"],
  ["High 6-B", "Large Country level"],
  ["6-A", "Continent level"],
  ["High 6-A", "Multi-Continent level"],
  ["5-C", "Moon level"],
  ["Low 5-B", "Small Planet level"],
  ["5-B", "Planet level"],
  ["5-A", "Large Planet level"],
  ["High 5-A", "Dwarf Star level"],
  ["Low 4-C", "Small Star level"],
  ["4-C", "Star level"],
  ["High 4-C", "Large Star level"],
  ["4-B", "Solar System level"],
  ["4-A", "Multi-Solar System level"],
  ["3-C", "Galaxy level"],
  ["3-B", "Multi-Galaxy level"],
  ["3-A", "Universe level"],
  ["High 3-A", "High Universe level"],
  ["Low 2-C", "Universe level+", 4],
  ["2-C", "Low Multiverse level", 4],
  ["2-B", "Multiverse level", 4],
  ["2-A", "Multiverse level+", 4],
  ["Low 1-C", "Low Complex Multiverse level", 5],
  ["1-C", "Complex Multiverse level", 7],
  ["High 1-C", "High Complex Multiverse level", 10],
  ["1-B", "Hyperverse level", 12],
  ["High 1-B", "High Hyperverse level", 13],
  ["Low 1-A", "Low Outerverse level", 14],
  ["1-A", "Outerverse level", 15],
  ["High 1-A", "High Outerverse level", 16],
  ["0", "Boundless", 17],
];

export const AP_TIERS: readonly ApTier[] = rows.map(([id, label, dimension]) => ({
  id,
  label,
  group: Number(id.match(/\d+/)![0]),
  dimension: dimension ?? MIN_DIMENSION,
}));

const AP_INDEX = new Map(AP_TIERS.map((t, i) => [t.id, i]));

export function isApTier(id: string): boolean {
  return AP_INDEX.has(id);
}

export function apIndex(id: string): number {
  const index = AP_INDEX.get(id);
  if (index === undefined) throw new Error(`Unknown attack potency tier: ${id}`);
  return index;
}

export function apLabel(index: number): string {
  return AP_TIERS[index]?.label ?? "Unknown";
}

/** Slowest to fastest. "Omnipresent" is a state, not a speed, so it is modelled as hax later. */
export const SPEED_LEVELS: readonly string[] = [
  "Immobile",
  "Below Average Human",
  "Normal Human",
  "Athletic Human",
  "Peak Human",
  "Superhuman",
  "Subsonic",
  "Subsonic+",
  "Transonic",
  "Supersonic",
  "Supersonic+",
  "Hypersonic",
  "Hypersonic+",
  "High Hypersonic",
  "High Hypersonic+",
  "Massively Hypersonic",
  "Massively Hypersonic+",
  "Sub-Relativistic",
  "Sub-Relativistic+",
  "Relativistic",
  "Relativistic+",
  "Speed of Light",
  "FTL",
  "FTL+",
  "Massively FTL",
  "Massively FTL+",
  "Infinite",
  "Immeasurable",
  "Irrelevant",
];

const SPEED_INDEX = new Map(SPEED_LEVELS.map((s, i) => [s, i]));

export function isSpeedLevel(id: string): boolean {
  return SPEED_INDEX.has(id);
}

export function speedIndex(id: string): number {
  const index = SPEED_INDEX.get(id);
  if (index === undefined) throw new Error(`Unknown speed level: ${id}`);
  return index;
}

export function speedLabel(index: number): string {
  return SPEED_LEVELS[index] ?? "Unknown";
}

export function dimensionLabel(n: number): string {
  if (n <= 12) return `${n}D`;
  if (n === 13) return "Infinite-D";
  return "Beyond infinite-D";
}
