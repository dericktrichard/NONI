import { describe, expect, it } from "vitest";
import { parseFeatImport, planFeatImport } from "@/lib/import/feats";

const feat = (over: Record<string, unknown> = {}) => ({
  characterId: "luffy",
  title: "Defeats a big foe",
  description: "Beats a much bigger foe in a clear fight.",
  claim: { category: "attackPotency", tier: "6-A" },
  proofs: [
    {
      source: "primary",
      type: "official",
      url: "https://www.viz.com/one-piece",
      locator: "Chapter 1",
    },
  ],
  ...over,
});

function plan(rows: unknown[], stored = new Map([["luffy", new Set<string>()]])) {
  const parsed = parseFeatImport(JSON.stringify({ feats: rows }));
  if (!parsed.ok) throw new Error(parsed.error);
  return planFeatImport(parsed.rows, stored);
}

describe("feat import", () => {
  it("accepts a valid feat as new", () => {
    const result = plan([feat()]);
    expect(result.items[0]?.status).toBe("new");
    expect(result.ready).toHaveLength(1);
  });

  it("refuses an unknown character", () => {
    expect(plan([feat({ characterId: "nobody" })]).items[0]?.status).toBe("invalid");
  });

  it("skips a title the character already has", () => {
    const stored = new Map([["luffy", new Set(["defeats a big foe"])]]);
    expect(plan([feat()], stored).items[0]?.status).toBe("exists");
  });

  it("refuses a tier that is not on the scale", () => {
    const row = feat({ claim: { category: "attackPotency", tier: "99-Z" } });
    expect(plan([row]).items[0]?.status).toBe("invalid");
  });

  it("refuses proof without a primary source", () => {
    const row = feat({
      proofs: [
        { source: "secondary", type: "wiki", url: "https://example.com/a", locator: "A" },
      ],
    });
    expect(plan([row]).items[0]?.status).toBe("invalid");
  });

  it("refuses a repeated title in one file", () => {
    const result = plan([feat(), feat()]);
    expect(result.items.map((item) => item.status)).toEqual(["new", "invalid"]);
  });

  it("rejects bad JSON and unknown keys", () => {
    expect(parseFeatImport("{").ok).toBe(false);
    expect(parseFeatImport(JSON.stringify({ feats: [feat({ extra: 1 })] })).ok).toBe(
      false,
    );
  });
});
