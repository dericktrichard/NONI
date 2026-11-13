import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { BATTLE } from "@/lib/battle/config";
import { counterTeam, randomTeam } from "@/lib/battle/counter";
import {
  TEAM_MESSAGES,
  checkTeams,
  estimateWin,
  simulateClash,
  type ClashResult,
} from "@/lib/battle/clash";
import { buildClimb, type ClimbMode, type ClimbResult } from "@/lib/battle/climb";
import type { Difficulty } from "@/lib/battle/types";
import type { BattleCard } from "@/lib/battle/view";
import { clashSettlement, climbSettlement } from "@/lib/glaze/rules";
import { HttpError } from "@/lib/data/feats";
import { mulberry32 } from "@/lib/play/game";
import { loadEntrants, loadPool } from "./battle-pool";
import { settleGlaze, type GlazeChange } from "./glaze";
import { recordBattle } from "./standing";

const BATTLES = "battles";
const newSeed = () => Math.floor(Math.random() * 2 ** 32);

export interface ClashOutcome {
  id: string;
  result: ClashResult;
  teamA: BattleCard[];
  teamB: BattleCard[];
  stake: number;
  /** Team A's chance to win, estimated before the battle was played */
  chance: number;
  settlement: GlazeChange;
}

export interface ClimbOutcome {
  id: string;
  result: ClimbResult;
  cards: Record<string, BattleCard>;
  stake: number;
  settlement: GlazeChange;
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
      ? counterTeam(
          entrants,
          against.map((item) => item.entrant),
          input.difficulty,
          request,
        )
      : randomTeam(entrants, request);

  if (!team) throw new HttpError(409, "Not enough characters to build that team yet.");

  const cards = new Map(pool.map((item) => [item.card.slug, item.card]));
  return team.map((entrant) => cards.get(entrant.profile.slug)!);
}

export async function playClash(
  uid: string,
  slugsA: string[],
  slugsB: string[],
  stake: number,
): Promise<ClashOutcome> {
  const [loadedA, loadedB] = await Promise.all([
    loadEntrants(slugsA),
    loadEntrants(slugsB),
  ]);
  if (!loadedA || !loadedB)
    throw new HttpError(400, "One of the characters does not exist.");

  const profilesA = loadedA.map((item) => item.entrant.profile);
  const profilesB = loadedB.map((item) => item.entrant.profile);
  const issue = checkTeams(profilesA, profilesB);
  if (issue) throw new HttpError(400, TEAM_MESSAGES[issue]);

  const seed = newSeed();
  const result = simulateClash(profilesA, profilesB, { rng: mulberry32(seed) });
  const chance = estimateWin(profilesA, profilesB, BATTLE.simRuns, (run) =>
    mulberry32(seed + run + 1),
  );
  const settlement = clashSettlement({
    stake,
    chance,
    outcome: result.winner === "a" ? "win" : result.winner === "b" ? "loss" : "draw",
  });

  const ref = adminDb().collection(BATTLES).doc();
  const change = await settleGlaze(uid, settlement, stake, "clash", ref.id);
  await ref.set({
    uid,
    kind: "clash",
    seed,
    stake,
    chance,
    teamA: slugsA,
    teamB: slugsB,
    winner: result.winner,
    survivorsA: result.survivorsA.length,
    survivorsB: result.survivorsB.length,
    change: change.change,
    createdAt: FieldValue.serverTimestamp(),
  });

  await recordBattle(uid, {
    kind: "clash",
    slugs: slugsA,
    won: result.winner === "a",
    title: false,
    change: change.change,
  });

  return {
    id: ref.id,
    result,
    teamA: loadedA.map((i) => i.card),
    teamB: loadedB.map((i) => i.card),
    stake,
    chance,
    settlement: change,
  };
}

export async function playClimb(
  uid: string,
  hero: string,
  size: number,
  mode: ClimbMode,
  difficulty: Difficulty,
  stake: number,
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
    Math.random,
    true,
  );
  if (!result)
    throw new HttpError(409, "Not enough characters to fill that bracket yet.");

  const used = new Set(result.rounds[0]!.flatMap((match) => [match.a, match.b]));
  const cards: Record<string, BattleCard> = {};
  for (const item of [...pool, loadedHero[0]!])
    if (used.has(item.card.slug)) cards[item.card.slug] = item.card;

  const settlement = climbSettlement({
    stake,
    wins: result.wins,
    rounds: result.rounds.length,
    mode,
    strength: difficulty,
  });
  const ref = adminDb().collection(BATTLES).doc();
  const change = await settleGlaze(uid, settlement, stake, "climb", ref.id);
  await ref.set({
    uid,
    kind: "climb",
    hero,
    size,
    mode,
    difficulty,
    stake,
    wins: result.wins,
    champion: result.champion,
    change: change.change,
    result: JSON.stringify(result),
    createdAt: FieldValue.serverTimestamp(),
  });

  const title = result.beatenBy === null;
  await recordBattle(uid, {
    kind: "climb",
    slugs: [hero],
    won: title,
    title,
    change: change.change,
  });

  return { id: ref.id, result, cards, stake, settlement: change };
}
