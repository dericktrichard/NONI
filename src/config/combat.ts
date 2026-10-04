/**
 * Every tunable number in the matchup resolver lives here.
 * Change a value, run the tests, and the whole ranking follows.
 */

export interface HaxKindInfo {
  label: string;
  /**
   * How likely a landed ability of this kind is to end the fight, 0 to 1.
   * Zero marks a utility kind that has no direct offense of its own.
   */
  weight: number;
}

export const HAX_KINDS = {
  "existence-erasure": { label: "Existence erasure", weight: 0.95 },
  "reality-warping": { label: "Reality warping", weight: 0.9 },
  "death-manipulation": { label: "Death manipulation", weight: 0.9 },
  "conceptual-manipulation": { label: "Conceptual manipulation", weight: 0.85 },
  "durability-negation": { label: "Durability negation", weight: 0.85 },
  "causality-manipulation": { label: "Causality manipulation", weight: 0.8 },
  "soul-manipulation": { label: "Soul manipulation", weight: 0.8 },
  sealing: { label: "Sealing", weight: 0.8 },
  "time-manipulation": { label: "Time manipulation", weight: 0.75 },
  "mind-manipulation": { label: "Mind manipulation", weight: 0.7 },
  "space-manipulation": { label: "Space manipulation", weight: 0.7 },
  "probability-manipulation": { label: "Probability manipulation", weight: 0.6 },
  "gravity-manipulation": { label: "Gravity manipulation", weight: 0.5 },
  "poison-disease": { label: "Poison and disease", weight: 0.4 },
  /** Utility: lets a lower-dimensional attacker affect higher-dimensional targets */
  "dimensional-reach": { label: "Dimensional reach", weight: 0 },
  /** Utility, used as a resistance: blocks every ability up to its power */
  nullification: { label: "Nullification", weight: 0 },
} as const satisfies Record<string, HaxKindInfo>;

export type HaxKind = keyof typeof HAX_KINDS;

export const HAX_KIND_LIST = Object.keys(HAX_KINDS) as HaxKind[];

export function isHaxKind(value: string): value is HaxKind {
  return Object.hasOwn(HAX_KINDS, value);
}

export const COMBAT = {
  /**
   * Chance that raw damage hurts, as a logistic of (attack potency - durability + offset) / scale,
   * measured in tier steps. At equal tiers it is a little better than even, five steps
   * above it is near certain, five steps below it is near impossible.
   */
  harmOffset: 0.5,
  harmScale: 1.5,

  /** Speed steps per logistic unit. A gap of 4 steps gives the faster side about 88% initiative. */
  speedScale: 2,
  /** How much initiative matters (0 to 1). The rest is a flat baseline. */
  initiativeWeight: 0.7,

  /** Multiplier per dimension of difference for attackers hitting a higher-dimensional target */
  dimensionGate: 0.05,

  /** A hax claim is attenuated when the target's durability exceeds its scope by more than this many tier steps */
  haxScopeSlack: 8,
  haxScopePenalty: 0.5,

  /** Below this best-case offense, neither side can really hurt the other */
  stalemateFloor: 0.1,

  /** Verdict thresholds on the winner's probability */
  verdict: { decisive: 0.9, clear: 0.75, narrow: 0.6 },
  /** Within this distance of 0.5 there is no winner at all */
  evenBand: 0.01,
} as const;
