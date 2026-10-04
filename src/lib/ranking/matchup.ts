import { COMBAT, HAX_KINDS, type HaxKind } from "@/config/combat";
import { apLabel, dimensionLabel, speedLabel } from "@/config/scales";
import type { CombatProfile } from "./profile";

export type Side = "a" | "b";
export type Verdict = "decisive" | "clear" | "narrow" | "toss-up" | "stalemate";

export type ReasonCode =
  | "damage"
  | "speed"
  | "dimension"
  | "hax_lands"
  | "hax_blocked"
  | "stalemate";

export interface MatchupReason {
  code: ReasonCode;
  favors: Side | "even";
  note: string;
}

export interface MatchupResult {
  /** Probability that A wins, from 0 to 1. The probability for B is exactly 1 minus this. */
  probabilityA: number;
  /** Null when the fight is a stalemate or too close to call */
  winner: Side | null;
  verdict: Verdict;
  /** How effectively each side can end the fight, 0 to 1, for the UI bars */
  offenseA: number;
  offenseB: number;
  /** A's share of initiative, 0 to 1 */
  initiativeA: number;
  reasons: MatchupReason[];
}

interface Offense {
  value: number;
  harm: number;
  hax: number;
  haxKind: HaxKind | null;
  gate: number;
  blocked: HaxKind[];
}

const logistic = (x: number) => 1 / (1 + Math.exp(-x));

function isBlocked(hax: { kind: HaxKind; power: number }, target: CombatProfile): boolean {
  return target.resistances.some(
    (r) => (r.kind === hax.kind || r.kind === "nullification") && r.power >= hax.power,
  );
}

/** How effectively `attacker` can end a fight with `target`, ignoring who moves first */
function offense(attacker: CombatProfile, target: CombatProfile): Offense {
  const harm = logistic(
    (attacker.ap - target.durability + COMBAT.harmOffset) / COMBAT.harmScale,
  );

  let hax = 0;
  let haxKind: HaxKind | null = null;
  const blocked: HaxKind[] = [];

  for (const ability of attacker.hax) {
    const weight = HAX_KINDS[ability.kind].weight;
    if (weight === 0) continue;
    if (isBlocked(ability, target)) {
      blocked.push(ability.kind);
      continue;
    }
    const outOfScope = target.durability - ability.power > COMBAT.haxScopeSlack;
    const effective = outOfScope ? weight * COMBAT.haxScopePenalty : weight;
    if (effective > hax) {
      hax = effective;
      haxKind = ability.kind;
    }
  }

  const dimensionGap = target.dimension - attacker.dimension;
  const hasReach = attacker.hax.some((h) => h.kind === "dimensional-reach");
  const gate = dimensionGap > 0 && !hasReach ? COMBAT.dimensionGate ** dimensionGap : 1;

  const value = (1 - (1 - harm) * (1 - hax)) * gate;
  return { value, harm, hax, haxKind, gate, blocked };
}

interface Evaluation {
  probabilityA: number;
  stalemate: boolean;
  a: Offense;
  b: Offense;
  initiativeA: number;
}

function evaluate(a: CombatProfile, b: CombatProfile): Evaluation {
  const offA = offense(a, b);
  const offB = offense(b, a);
  const initiativeA = logistic((a.speed - b.speed) / COMBAT.speedScale);

  const stalemate = Math.max(offA.value, offB.value) < COMBAT.stalemateFloor;
  if (stalemate) {
    return { probabilityA: 0.5, stalemate, a: offA, b: offB, initiativeA };
  }

  const w = COMBAT.initiativeWeight;
  const threatA = offA.value * (w * initiativeA + (1 - w) * 0.5);
  const threatB = offB.value * (w * (1 - initiativeA) + (1 - w) * 0.5);

  return {
    probabilityA: threatA / (threatA + threatB),
    stalemate,
    a: offA,
    b: offB,
    initiativeA,
  };
}

/** The fast path used by the ranking loop. No strings are built. */
export function winProbability(a: CombatProfile, b: CombatProfile): number {
  return evaluate(a, b).probabilityA;
}

function verdictOf(probabilityA: number, stalemate: boolean): Verdict {
  if (stalemate) return "stalemate";
  const lead = Math.max(probabilityA, 1 - probabilityA);
  if (lead >= COMBAT.verdict.decisive) return "decisive";
  if (lead >= COMBAT.verdict.clear) return "clear";
  if (lead >= COMBAT.verdict.narrow) return "narrow";
  return "toss-up";
}

function winnerOf(probabilityA: number, stalemate: boolean): Side | null {
  if (stalemate || Math.abs(probabilityA - 0.5) <= COMBAT.evenBand) return null;
  return probabilityA > 0.5 ? "a" : "b";
}

function buildReasons(a: CombatProfile, b: CombatProfile, e: Evaluation): MatchupReason[] {
  const reasons: MatchupReason[] = [];

  // Raw damage
  const aHurts = e.a.harm >= 0.5;
  const bHurts = e.b.harm >= 0.5;
  if (aHurts && !bHurts) {
    reasons.push({
      code: "damage",
      favors: "a",
      note: `${a.name} (${apLabel(a.ap)}) can harm ${b.name} (durability ${apLabel(b.durability)}), but not the other way round.`,
    });
  } else if (bHurts && !aHurts) {
    reasons.push({
      code: "damage",
      favors: "b",
      note: `${b.name} (${apLabel(b.ap)}) can harm ${a.name} (durability ${apLabel(a.durability)}), but not the other way round.`,
    });
  } else if (aHurts && bHurts) {
    reasons.push({ code: "damage", favors: "even", note: "Both can harm each other with raw damage." });
  } else {
    reasons.push({ code: "damage", favors: "even", note: "Neither can reliably harm the other with raw damage." });
  }

  // Speed
  if (a.speed === b.speed) {
    reasons.push({ code: "speed", favors: "even", note: `Both move at ${speedLabel(a.speed)} speed.` });
  } else {
    const fasterIsA = a.speed > b.speed;
    const faster = fasterIsA ? a : b;
    const slower = fasterIsA ? b : a;
    reasons.push({
      code: "speed",
      favors: fasterIsA ? "a" : "b",
      note: `${faster.name} is faster (${speedLabel(faster.speed)} against ${speedLabel(slower.speed)}).`,
    });
  }

  // Dimensions
  for (const [attacker, target, offence, side] of [
    [a, b, e.a, "b"],
    [b, a, e.b, "a"],
  ] as const) {
    if (offence.gate < 1) {
      reasons.push({
        code: "dimension",
        favors: side,
        note: `${attacker.name} (${dimensionLabel(attacker.dimension)}) struggles to affect ${target.name} (${dimensionLabel(target.dimension)}) without dimensional reach.`,
      });
    }
  }

  // Abilities
  for (const [attacker, target, offence, side] of [
    [a, b, e.a, "a"],
    [b, a, e.b, "b"],
  ] as const) {
    if (offence.haxKind && offence.hax > 0) {
      reasons.push({
        code: "hax_lands",
        favors: side,
        note: `${attacker.name}'s ${HAX_KINDS[offence.haxKind].label.toLowerCase()} lands on ${target.name}.`,
      });
    }
    for (const kind of offence.blocked) {
      reasons.push({
        code: "hax_blocked",
        favors: side === "a" ? "b" : "a",
        note: `${target.name} resists ${attacker.name}'s ${HAX_KINDS[kind].label.toLowerCase()}.`,
      });
    }
  }

  if (e.stalemate) {
    reasons.push({
      code: "stalemate",
      favors: "even",
      note: "Neither side has a way to end the fight, so it stalls.",
    });
  }

  return reasons;
}

/** Full result with explanations, for matchup pages. Pure: the same inputs always give the same output. */
export function resolveMatchup(a: CombatProfile, b: CombatProfile): MatchupResult {
  const e = evaluate(a, b);
  return {
    probabilityA: e.probabilityA,
    winner: winnerOf(e.probabilityA, e.stalemate),
    verdict: verdictOf(e.probabilityA, e.stalemate),
    offenseA: e.a.value,
    offenseB: e.b.value,
    initiativeA: e.initiativeA,
    reasons: buildReasons(a, b, e),
  };
}
