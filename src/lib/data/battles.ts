import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { counterTeam, randomTeam } from "@/lib/battle/counter";
import { TEAM_MESSAGES, checkTeams, simulateClash, teamEdge, type ClashResult } from "@/lib/battle/clash";
import { buildClimb, type ClimbMode, type ClimbResult } from "@/lib/battle/climb";
import type { Difficulty } from "@/lib/battle/types";
import type { BattleCard } from "@/lib/battle/view";
import { clashReward, climbReward } from "@/lib/glaze/rules";
import { HttpError } from "@/lib/data/feats";
import { loadEntrants, loadPool } from "./battle-pool";
import { grantGlaze, type GlazeGrant } from "./glaze";

const BATTLES = "battles";

export interface ClashOutcome {
  id: string;
  result: ClashResult;
  teamA: BattleCard[];
  teamB: BattleCard[];
  /** The player's average win chance across every pairing, 0 to 1 */
  edge: number;
  reward: GlazeGrant;
}

export interface ClimbOutcome {
  id: string;
  result: ClimbResult;
  cards: Record<string, BattleCard>;
  reward: GlazeGrant;
}

export async function suggestTeam(input: {
  mode: "random" | "counter";
  size: number;
  against: string[];
  exclude: string[];
  difficulty: Difficulty;
}): Promise<BattleCard[]> {
  const pool = await loadPool();
  const against = input.against.length > 0 ? await loadEntrants(input.against) : [];
  if (!against) throw new HttpError(400, "One of the characters does not exist.");

  const exclude = new Set([...input.against, ...input.exclude]);
  const request = { size: input.size, exclude, rng: Math.random };
  const entrants = pool.map((item) => item.entrant);

  const team =
    input.mode === "counter"
      ? counterTeam(entrants, against.map((item) => item.entrant), input.difficulty, request)
      : randomTeam(entrants, request);

  if (!team) throw new HttpError(409, "Not enough characters to build that team yet.");

  const cards = new Map(pool.map((item) => [item.card.slug, item.card]));
  return team.map((entrant) => cards.get(entrant.profile.slug)!);
}

export async function playClash(uid: string, slugsA: string[], slugsB: string[]): Promise<ClashOutcome> {
  const [loadedA, loadedB] = await Promise.all([loadEntrants(slugsA), loadEntrants(slugsB)]);
  if (!loadedA || !loadedB) throw new HttpError(400, "One of the characters does not exist.");

  const profilesA = loadedA.map((item) => item.entrant.profile);
  const profilesB = loadedB.map((item) => item.entrant.profile);
  const issue = checkTeams(profilesA, profilesB);
  if (issue) throw new HttpError(400, TEAM_MESSAGES[issue]);

  const result = simulateClash(profilesA, profilesB);
  const edge = teamEdge(profilesA, profilesB);
  const amount = clashReward({ won: result.winner === "a", survivors: result.survivorsA.length, edge });

  const ref = adminDb().collection(BATTLES).doc();
  await ref.set({
    uid,
    kind: "clash",
    teamA: slugsA,
    teamB: slugsB,
    winner: result.winner,
    survivorsA: result.survivorsA.length,
    survivorsB: result.survivorsB.length,
    createdAt: FieldValue.serverTimestamp(),
  });
  const reward = await grantGlaze(uid, amount, "clash", ref.id);

  return { id: ref.id, result, teamA: loadedA.map((i) => i.card), teamB: loadedB.map((i) => i.card), edge, reward };
}

export async function playClimb(
  uid: string,
  hero: string,
  size: number,
  mode: ClimbMode,
  difficulty: Difficulty,
): Promise<ClimbOutcome> {
  const loadedHero = await loadEntrants([hero]);
  if (!loadedHero) throw new HttpError(400, "That character does not exist.");

  const pool = await loadPool();
  const result = buildClimb(
    pool.map((item) => item.entrant),
    loadedHero[0]!.entrant,
    size,
    mode,
    difficulty,
  );
  if (!result) throw new HttpError(409, "Not enough characters to fill that bracket yet.");

  const cards: Record<string, BattleCard> = { [hero]: loadedHero[0]!.card };
  for (const item of pool) cards[item.card.slug] = item.card;
  const used = new Set(result.rounds[0]!.flatMap((match) => [match.a, match.b]));
  for (const slug of Object.keys(cards)) if (!used.has(slug)) delete cards[slug];

  const amount = climbReward({ wins: result.wins, rounds: result.rounds.length, mode, difficulty });
  const ref = adminDb().collection(BATTLES).doc();
  await ref.set({
    uid,
    kind: "climb",
    hero,
    size,
    mode,
    difficulty,
    wins: result.wins,
    champion: result.champion,
    result: JSON.stringify(result),
    createdAt: FieldValue.serverTimestamp(),
  });
  const reward = await grantGlaze(uid, amount, "climb", ref.id);

  return { id: ref.id, result, cards, reward };
}