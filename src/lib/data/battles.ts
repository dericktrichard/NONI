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
import {
  FAIR,
  capNetWin,
  fanGrant,
  climbKey,
  climbReward,
  isRepeat,
  matchupKey,
  practiceReward,
  todayOf,
  type Today,
} from "@/lib/battle/fair-play";
import type { Difficulty } from "@/lib/battle/types";
import type { BattleCard } from "@/lib/battle/view";
import { clashSettlement } from "@/lib/glaze/rules";
import { HttpError } from "@/lib/data/feats";
import { mulberry32 } from "@/lib/play/game";
import { loadEntrants, loadPool } from "./battle-pool";
import { addResult, getDaily, reserve } from "./daily";
import { settleGlaze, type GlazeChange } from "./glaze";
import { announce, watchBefore } from "./notices";
import { recordBattle } from "./standing";

const BATTLES = "battles";
const REPEAT_NOTICE = "Repeat matchup today, so no Glaze or standing.";
const newSeed = () => Math.floor(Math.random() * 2 ** 32);

type Item = Awaited<ReturnType<typeof loadPool>>[number];

export interface ClashOutcome {
  id: string;
  result: ClashResult;
  teamA: BattleCard[];
  teamB: BattleCard[];
  stake: number;
  /** Team A's chance to win, estimated before the battle was played */
  chance: number;
  settlement: GlazeChange;
  /** The opponent was chosen by the matchmaker */
  matchmade: boolean;
  repeat: boolean;
  notice: string | null;
  /** Rank changes and badges earned by this match */
  moves: string[];
  today: Today;
}

export interface ClimbOutcome {
  id: string;
  result: ClimbResult;
  cards: Record<string, BattleCard>;
  settlement: GlazeChange;
  repeat: boolean;
  notice: string | null;
  /** Rank changes and badges earned by this match */
  moves: string[];
  today: Today;
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

/** After the first match of the day the opponent is built from the player's team, avoiding matchups already played */
async function matchmake(
  mine: Item[],
  slugs: string[],
  difficulty: Difficulty,
  seen: string[],
): Promise<Item[]> {
  const pool = await loadPool();
  const entrants = pool.map((item) => item.entrant);
  const bySlug = new Map(pool.map((item) => [item.card.slug, item] as const));
  const against = mine.map((item) => item.entrant);
  const exclude = new Set(slugs);

  let team: Item[] | null = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const picked = counterTeam(entrants, against, difficulty, {
      size: slugs.length,
      exclude,
      rng: Math.random,
    });
    if (!picked) break;
    team = picked.map((entrant) => bySlug.get(entrant.profile.slug)!);
    if (
      !isRepeat(
        seen,
        matchupKey(
          slugs,
          team.map((item) => item.card.slug),
        ),
      )
    )
      break;
  }
  if (!team) throw new HttpError(409, "Not enough characters to build an opponent yet.");
  return team;
}

export async function playClash(
  uid: string,
  slugsA: string[],
  slugsB: string[],
  stake: number,
  difficulty: Difficulty,
): Promise<ClashOutcome> {
  const loadedA = await loadEntrants(slugsA);
  if (!loadedA) throw new HttpError(400, "One of the characters does not exist.");

  const daily = await getDaily(uid);
  const matchmade = daily.matches > 0;
  let loadedB: Item[] | null;
  if (matchmade) {
    loadedB = await matchmake(loadedA, slugsA, difficulty, daily.matchups);
  } else {
    if (slugsB.length === 0) throw new HttpError(400, "Choose the opponent team.");
    loadedB = await loadEntrants(slugsB);
  }
  if (!loadedB) throw new HttpError(400, "One of the characters does not exist.");

  const teamB = loadedB.map((item) => item.card.slug);
  const profilesA = loadedA.map((item) => item.entrant.profile);
  const profilesB = loadedB.map((item) => item.entrant.profile);
  const issue = checkTeams(profilesA, profilesB);
  if (issue) throw new HttpError(400, TEAM_MESSAGES[issue]);

  const { before, repeat } = await reserve(uid, {
    kind: "clash",
    key: matchupKey(slugsA, teamB),
    stake,
  });
  const watch = repeat ? null : await watchBefore(uid, slugsA);

  const seed = newSeed();
  const result = simulateClash(profilesA, profilesB, { rng: mulberry32(seed) });
  const chance = estimateWin(profilesA, profilesB, BATTLE.simRuns, (run) =>
    mulberry32(seed + run + 1),
  );
  const won = result.winner === "a";

  let delta: number;
  let notice: string | null = null;
  if (stake > 0) {
    const raw = clashSettlement({
      stake,
      chance,
      outcome: won ? "win" : result.winner === "b" ? "loss" : "draw",
    }).delta;
    delta = capNetWin({ delta: raw, netToday: before.net });
    if (delta < raw) notice = "Daily winnings limit reached.";
  } else {
    delta = practiceReward({ won, repeat, earnedToday: before.practice });
    if (repeat) notice = REPEAT_NOTICE;
    else if (won && delta === 0) notice = "Daily practice limit reached.";
  }

  const ref = adminDb().collection(BATTLES).doc();
  const change = await settleGlaze(uid, { delta }, stake, "clash", ref.id);
  await addResult(uid, stake > 0 ? { net: change.change } : { practice: change.change });
  await ref.set({
    uid,
    kind: "clash",
    seed,
    stake,
    chance,
    matchmade,
    repeat,
    teamA: slugsA,
    teamB,
    winner: result.winner,
    survivorsA: result.survivorsA.length,
    survivorsB: result.survivorsB.length,
    change: change.change,
    createdAt: FieldValue.serverTimestamp(),
  });

  let moves: string[] = [];
  if (!repeat) {
    const points = fanGrant("clash", slugsA, before.fan);
    await recordBattle(uid, {
      kind: "clash",
      slugs: slugsA,
      won,
      title: false,
      change: change.change,
      points,
    });
    await addResult(uid, { fan: points });
    moves = await announce(uid, watch, points);
  }

  const today = todayOf({
    ...before,
    matches: before.matches + 1,
    staked: before.staked + (stake > 0 ? 1 : 0),
    net: before.net + (stake > 0 ? change.change : 0),
    practice: before.practice + (stake === 0 ? change.change : 0),
  });

  return {
    id: ref.id,
    result,
    teamA: loadedA.map((i) => i.card),
    teamB: loadedB.map((i) => i.card),
    stake,
    chance,
    settlement: change,
    matchmade,
    repeat,
    notice,
    moves,
    today,
  };
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
    Math.random,
    true,
  );
  if (!result)
    throw new HttpError(409, "Not enough characters to fill that bracket yet.");

  const used = new Set(result.rounds[0]!.flatMap((match) => [match.a, match.b]));
  const cards: Record<string, BattleCard> = {};
  for (const item of [...pool, loadedHero[0]!])
    if (used.has(item.card.slug)) cards[item.card.slug] = item.card;

  const { before, repeat } = await reserve(uid, {
    kind: "climb",
    key: climbKey(hero, size),
    stake: 0,
  });
  const title = result.beatenBy === null;
  const rewarded = !repeat && before.climbRuns < FAIR.climb.runsPerDay;
  const watch = rewarded ? await watchBefore(uid, [hero]) : null;
  const delta = climbReward({
    wins: result.wins,
    size,
    champion: title,
    repeat,
    runsToday: before.climbRuns,
  });
  const notice = repeat
    ? REPEAT_NOTICE
    : !rewarded
      ? "Daily tournament reward limit reached."
      : null;

  const ref = adminDb().collection(BATTLES).doc();
  const change = await settleGlaze(uid, { delta }, 0, "climb", ref.id);
  await ref.set({
    uid,
    kind: "climb",
    hero,
    size,
    mode,
    difficulty,
    repeat,
    wins: result.wins,
    champion: result.champion,
    change: change.change,
    result: JSON.stringify(result),
    createdAt: FieldValue.serverTimestamp(),
  });

  let moves: string[] = [];
  if (rewarded) {
    const points = fanGrant("climb", [hero], before.fan);
    await recordBattle(uid, {
      kind: "climb",
      slugs: [hero],
      won: title,
      title,
      change: change.change,
      points,
    });
    await addResult(uid, { fan: points });
    moves = await announce(uid, watch, points);
  }

  return {
    id: ref.id,
    result,
    cards,
    settlement: change,
    repeat,
    notice,
    moves,
    today: todayOf({ ...before, climbRuns: before.climbRuns + 1 }),
  };
}
