import type { ClashFight } from "./clash";

export type FighterStatus = "waiting" | "fighting" | "fallen" | "standing";

export interface FighterState {
  slug: string;
  vitality: number;
  status: FighterStatus;
}

/** Every fighter's state once the first `resolved` fights are settled, with `active` still in the ring */
export function replayAt(slugs: readonly string[], fights: readonly ClashFight[], resolved: number, active?: ClashFight): FighterState[] {
  const done = fights.slice(0, resolved);

  return slugs.map((slug) => {
    let vitality = 1;
    let fallen = false;
    for (const fight of done) {
      if (fight.a === slug) vitality = fight.vitalityAfterA;
      else if (fight.b === slug) vitality = fight.vitalityAfterB;
      fallen ||= fight.fallen.includes(slug);
    }
    const fighting = active !== undefined && (active.a === slug || active.b === slug);
    const status: FighterStatus = fallen ? "fallen" : fighting ? "fighting" : resolved >= fights.length ? "standing" : "waiting";
    return { slug, vitality: fallen ? 0 : vitality, status };
  });
}