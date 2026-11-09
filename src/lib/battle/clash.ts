import { resolveMatchup, winProbability, type MatchupResult, type ReasonCode, type Side, type Verdict } from "@/lib/ranking/matchup";
import type { CombatProfile } from "@/lib/ranking/profile";
import { BATTLE } from "./config";
import { cmp } from "./types";

export interface Survivor {
  slug: string;
  name: string;
  /** 0 to 1. A fresh fighter has 1. */
  vitality: number;
}

export interface ClashFight {
  index: number;
  a: string;
  b: string;
  aName: string;
  bName: string;
  vitalityBeforeA: number;
  vitalityBeforeB: number;
  /** The engine's probability that A wins at full health */
  baseProbabilityA: number;
  /** The same after wounds are counted in */
  effectiveProbabilityA: number;
  verdict: Verdict;
  /** Null for a stalemate: neither can hurt the other, so both withdraw */
  winner: Side | null;
  /** The winner's chance going into the fight */
  winnerChance: number;
  /** The less likely fighter won */
  upset: boolean;
  /** Wounds changed the result the engine would give at full health */
  worn: boolean;
  fallen: string[];
  vitalityAfterA: number;
  vitalityAfterB: number;
  note: string;
}

export interface ClashResult {
  winner: Side | "draw";
  fights: ClashFight[];
  survivorsA: Survivor[];
  survivorsB: Survivor[];
}

export type Resolver = (a: CombatProfile, b: CombatProfile) => MatchupResult;

export interface ClashOptions {
  /** With a random source each fight is sampled from its odds, so upsets happen. Without one the favourite always wins. */
  rng?: () => number;
  resolve?: Resolver;
}

export type TeamIssue = "empty" | "size" | "duplicate" | "overlap";

export const TEAM_MESSAGES: Record<TeamIssue, string> = {
  empty: "Each team needs at least one character.",
  size: `Teams must be the same size, up to ${BATTLE.maxTeam} characters.`,
  duplicate: "A character can only be on a team once.",
  overlap: "A character cannot be on both teams.",
};

export function checkTeams(a: readonly CombatProfile[], b: readonly CombatProfile[]): TeamIssue | null {
  if (a.length === 0 || b.length === 0) return "empty";
  if (a.length !== b.length || a.length > BATTLE.maxTeam) return "size";
  const slugsA = a.map((p) => p.slug);
  const slugsB = b.map((p) => p.slug);
  if (new Set(slugsA).size !== slugsA.length || new Set(slugsB).size !== slugsB.length) return "duplicate";
  if (slugsA.some((slug) => slugsB.includes(slug))) return "overlap";
  return null;
}

/** The engine's win probability, moved by how worn down each fighter is */
export function effectiveProbability(base: number, vitalityA: number, vitalityB: number): number {
  const p = Math.min(1 - 1e-9, Math.max(1e-9, base));
  const odds = (p / (1 - p)) * (vitalityA / vitalityB) ** BATTLE.vitalityWeight;
  return odds / (1 + odds);
}

/** Vitality a winner loses, given its win probability. A narrow win costs a lot. */
export function woundFor(lead: number): number {
  return Math.min(BATTLE.woundMax, Math.max(BATTLE.woundMin, (1 - lead) * BATTLE.woundScale));
}

export const clampChance = (p: number): number => Math.min(1 - BATTLE.upsetFloor, Math.max(BATTLE.upsetFloor, p));

export function memoResolver(): Resolver {
  const cache = new Map<string, MatchupResult>();
  return (a, b) => {
    const key = `${a.slug}|${b.slug}`;
    let hit = cache.get(key);
    if (!hit) {
      hit = resolveMatchup(a, b);
      cache.set(key, hit);
    }
    return hit;
  };
}

const REASON_ORDER: ReasonCode[] = ["hax_lands", "hax_blocked", "dimension", "damage", "speed"];

/** The most telling engine reason that favours one side, or a fallback line */
export function reasonFor(result: MatchupResult, side: Side): string {
  for (const code of REASON_ORDER) {
    const found = result.reasons.find((reason) => reason.code === code && reason.favors === side);
    if (found) return found.note;
  }
  return result.reasons[0]?.note ?? "";
}

/** Average win probability of one group against another. 0.5 is an even split. */
export function teamEdge(team: readonly CombatProfile[], against: readonly CombatProfile[]): number {
  if (team.length === 0 || against.length === 0) return 0.5;
  let total = 0;
  for (const x of team) for (const y of against) total += winProbability(x, y);
  return total / (team.length * against.length);
}

interface Fighter {
  profile: CombatProfile;
  vitality: number;
}

function slimmestEdge(a: CombatProfile, b: CombatProfile): Side {
  if (a.verifiedFeatCount !== b.verifiedFeatCount) return a.verifiedFeatCount > b.verifiedFeatCount ? "a" : "b";
  return cmp(a.slug, b.slug) <= 0 ? "a" : "b";
}

/**
 * Fighters meet in line-up order. The winner of a duel stays on, wounded according to how
 * narrow the win was, and meets the next fighter. A loser falls.
 */
export function simulateClash(teamA: readonly CombatProfile[], teamB: readonly CombatProfile[], options: ClashOptions = {}): ClashResult {
  const { rng, resolve = resolveMatchup } = options;
  const queueA: Fighter[] = teamA.map((profile) => ({ profile, vitality: 1 }));
  const queueB: Fighter[] = teamB.map((profile) => ({ profile, vitality: 1 }));
  const fights: ClashFight[] = [];
  let ia = 0;
  let ib = 0;

  while (ia < queueA.length && ib < queueB.length) {
    const fa = queueA[ia]!;
    const fb = queueB[ib]!;
    const result = resolve(fa.profile, fb.profile);
    const stalemate = result.verdict === "stalemate";

    const effective = stalemate ? 0.5 : effectiveProbability(result.probabilityA, fa.vitality, fb.vitality);
    const favourite: Side | null = effective > 0.5 ? "a" : effective < 0.5 ? "b" : null;
    const winner: Side | null = stalemate
      ? null
      : rng
        ? rng() < clampChance(effective)
          ? "a"
          : "b"
        : (favourite ?? slimmestEdge(fa.profile, fb.profile));

    const upset = winner !== null && favourite !== null && winner !== favourite;
    const worn = !stalemate && !upset && result.winner !== winner && fa.vitality !== fb.vitality;
    const before = { a: fa.vitality, b: fb.vitality };

    let note: string;
    let fallen: string[];
    if (winner === null) {
      note = `${fa.profile.name} and ${fb.profile.name} cannot hurt each other. Both withdraw.`;
      fallen = [fa.profile.slug, fb.profile.slug];
      fa.vitality = 0;
      fb.vitality = 0;
      ia += 1;
      ib += 1;
    } else {
      const winning = winner === "a" ? fa : fb;
      const losing = winner === "a" ? fb : fa;
      const lead = winner === "a" ? effective : 1 - effective;

      if (upset) {
        note = `${winning.profile.name} pulls off the upset over ${losing.profile.name}.`;
      } else if (worn) {
        note = `${winning.profile.name} takes it because ${losing.profile.name} is worn down (${Math.round(
          (winner === "a" ? before.b : before.a) * 100,
        )}% left).`;
      } else if (result.winner === null) {
        note = `${winning.profile.name} takes it by the slimmest margin.`;
      } else {
        note = reasonFor(result, winner) || `${winning.profile.name} comes out on top.`;
      }

      winning.vitality = Math.max(BATTLE.minVitality, winning.vitality - woundFor(lead));
      losing.vitality = 0;
      fallen = [losing.profile.slug];
      if (winner === "a") ib += 1;
      else ia += 1;
    }

    fights.push({
      index: fights.length + 1,
      a: fa.profile.slug,
      b: fb.profile.slug,
      aName: fa.profile.name,
      bName: fb.profile.name,
      vitalityBeforeA: before.a,
      vitalityBeforeB: before.b,
      baseProbabilityA: result.probabilityA,
      effectiveProbabilityA: effective,
      verdict: result.verdict,
      winner,
      winnerChance: winner === null ? 0.5 : winner === "a" ? effective : 1 - effective,
      upset,
      worn,
      fallen,
      vitalityAfterA: fa.vitality,
      vitalityAfterB: fb.vitality,
      note,
    });
  }

  const alive = (queue: Fighter[], from: number): Survivor[] =>
    queue.slice(from).map((f) => ({ slug: f.profile.slug, name: f.profile.name, vitality: f.vitality }));

  const survivorsA = alive(queueA, ia);
  const survivorsB = alive(queueB, ib);
  const winner: Side | "draw" = survivorsA.length > 0 ? "a" : survivorsB.length > 0 ? "b" : "draw";

  return { winner, fights, survivorsA, survivorsB };
}

/** Team A's chance to win, from many sampled battles. A draw counts as half. */
export function estimateWin(
  teamA: readonly CombatProfile[],
  teamB: readonly CombatProfile[],
  runs: number,
  rngFor: (run: number) => () => number,
): number {
  const resolve = memoResolver();
  let score = 0;
  for (let run = 0; run < runs; run += 1) {
    const { winner } = simulateClash(teamA, teamB, { rng: rngFor(run), resolve });
    score += winner === "a" ? 1 : winner === "draw" ? 0.5 : 0;
  }
  return score / runs;
}