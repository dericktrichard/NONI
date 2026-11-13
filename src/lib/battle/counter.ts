import { winProbability } from "@/lib/ranking/matchup";
import { BATTLE } from "./config";
import { cmp, shuffled, type Difficulty, type Entrant } from "./types";

export interface TeamRequest {
  size: number;
  /** Slugs that may not be picked (the other team, the user's own picks) */
  exclude: ReadonlySet<string>;
  rng?: () => number;
}

function candidates(pool: readonly Entrant[], exclude: ReadonlySet<string>): Entrant[] {
  return pool
    .filter((e) => !exclude.has(e.profile.slug))
    .sort((x, y) => cmp(x.profile.slug, y.profile.slug));
}

function pickFrom<T>(
  ranked: readonly T[],
  rng: (() => number) | undefined,
): T | undefined {
  if (ranked.length === 0) return undefined;
  if (!rng) return ranked[0];
  return ranked[Math.floor(rng() * Math.min(BATTLE.pickWidth, ranked.length))];
}

/** A team from one power band, so a random pairing never feels hopeless. Returns null when the pool is too small. */
export function randomTeam(
  pool: readonly Entrant[],
  request: TeamRequest,
): Entrant[] | null {
  const rng = request.rng ?? Math.random;
  const free = candidates(pool, request.exclude).sort(
    (x, y) => y.score - x.score || cmp(x.profile.slug, y.profile.slug),
  );
  if (free.length < request.size) return null;

  const window = Math.min(free.length, Math.max(request.size * 3, request.size + 4));
  const start = Math.floor(rng() * (free.length - window + 1));
  const band = shuffled(free.slice(start, start + window), rng);

  const team: Entrant[] = [];
  const perVerse = new Map<string, number>();
  for (const entrant of [...band, ...free]) {
    if (team.length === request.size) break;
    if (team.includes(entrant)) continue;
    const used = perVerse.get(entrant.verse) ?? 0;
    if (
      used >= BATTLE.maxPerVerse &&
      team.length + (free.length - team.length) > request.size * 2
    )
      continue;
    team.push(entrant);
    perVerse.set(entrant.verse, used + 1);
  }
  return team.length === request.size ? team : null;
}

function meanAgainst(candidate: Entrant, opponents: readonly Entrant[]): number {
  let total = 0;
  for (const o of opponents) total += winProbability(candidate.profile, o.profile);
  return total / opponents.length;
}

/**
 * A team built to answer `against`. Each pick is the candidate that beats the most
 * still-uncovered opponents. Fair aims for a close fight, hard for the best answer available.
 */
export function counterTeam(
  pool: readonly Entrant[],
  against: readonly Entrant[],
  difficulty: Difficulty,
  request: TeamRequest,
): Entrant[] | null {
  const free = candidates(pool, request.exclude);
  if (free.length < request.size || against.length === 0) return null;

  const team: Entrant[] = [];
  const perVerse = new Map<string, number>();
  const covered = new Set<string>();

  while (team.length < request.size) {
    const open = against.filter((o) => !covered.has(o.profile.slug));
    const focus = open.length > 0 ? open : against;

    const ranked = free
      .filter(
        (e) => !team.includes(e) && (perVerse.get(e.verse) ?? 0) < BATTLE.maxPerVerse,
      )
      .map((e) => {
        const mean = meanAgainst(e, focus);
        const target = difficulty === "hard" ? 1 : BATTLE.fairTarget;
        return { e, rank: Math.abs(target - mean) };
      })
      .sort((x, y) => x.rank - y.rank || cmp(x.e.profile.slug, y.e.profile.slug));

    const choice =
      pickFrom(ranked, request.rng)?.e ?? free.find((e) => !team.includes(e));
    if (!choice) return null;

    team.push(choice);
    perVerse.set(choice.verse, (perVerse.get(choice.verse) ?? 0) + 1);
    for (const o of against) {
      if (winProbability(choice.profile, o.profile) >= BATTLE.coverAt)
        covered.add(o.profile.slug);
    }
  }
  return team;
}
