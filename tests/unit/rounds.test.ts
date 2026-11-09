import { describe, expect, it } from "vitest";
import type { ClimbMatch, ClimbResult } from "@/lib/battle/climb";
import { heroMatch, heroRounds, roundName } from "@/lib/battle/rounds";

const match = (round: number, a: string, b: string, winner: string): ClimbMatch => ({
  round,
  a,
  b,
  aName: a,
  bName: b,
  winner,
  probabilityA: 0.5,
  upset: false,
  note: "",
});

const result: ClimbResult = {
  size: 8,
  hero: "h",
  wins: 1,
  champion: "z",
  beatenBy: "b",
  rounds: [
    [match(1, "h", "a", "h"), match(1, "b", "c", "b"), match(1, "d", "e", "d"), match(1, "z", "f", "z")],
    [match(2, "h", "b", "b"), match(2, "d", "z", "z")],
    [match(3, "b", "z", "z")],
  ],
};

describe("roundName", () => {
  it("names rounds from the final backwards", () => {
    expect([1, 2, 3, 4].map((round) => roundName(round, 4))).toEqual(["Round of 16", "Quarter-final", "Semi-final", "Final"]);
    expect([1, 2, 3].map((round) => roundName(round, 3, true))).toEqual(["Quarter", "Semi", "Final"]);
    expect(roundName(1, 4, true)).toBe("R16");
  });
});

describe("heroMatch", () => {
  it("counts the lost round and stops there", () => {
    expect(heroRounds(result)).toBe(2);
    expect(heroRounds({ ...result, wins: 3, beatenBy: null })).toBe(3);
  });

  it("finds the hero's match only in rounds they played", () => {
    expect(heroMatch(result, 0)).toBeUndefined();
    expect(heroMatch(result, 1)?.b).toBe("a");
    expect(heroMatch(result, 2)?.winner).toBe("b");
    expect(heroMatch(result, 3)).toBeUndefined();
  });
});