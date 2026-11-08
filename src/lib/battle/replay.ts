import type { ClashFight } from "./clash";

export type FighterStatus = "waiting" | "fighting" | "fallen" | "standing";

export interface FighterState {
  slug: string;
  vitality: number;
  status: FighterStatus;
}

/** Every fighter's state once the first `shown` fights have played out */
export function replayAt(slugs: readonly string[], fights: readonly ClashFight[], shown: number): FighterState[] {
  const done = fights.slice(0, shown);
  const current = shown < fights.length ? done[done.length - 1] : undefined;

  return slugs.map((slug) => {
    let vitality = 1;
    let fallen = false;
    for (const fight of done) {
      if (fight.a === slug) vitality = fight.vitalityAfterA;
      else if (fight.b === slug) vitality = fight.vitalityAfterB;
      fallen ||= fight.fallen.includes(slug);
    }
    const fighting = current !== undefined && (current.a === slug || current.b === slug);
    const status: FighterStatus = fallen ? "fallen" : fighting ? "fighting" : shown >= fights.length ? "standing" : "waiting";
    return { slug, vitality: fallen ? 0 : vitality, status };
  });
}