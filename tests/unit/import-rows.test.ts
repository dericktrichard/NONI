import { describe, expect, it } from "vitest";
import { canPublish } from "@/lib/import/publish";
import { parseImport, planImport, type ImportRow } from "@/lib/import/rows";

const row = (extra: Partial<ImportRow> = {}): ImportRow => ({
  name: "Alpha",
  verse: "Test Verse",
  media: "comic",
  attackPotency: "6-A",
  durability: "6-A",
  speed: "Relativistic",
  ...extra,
});

describe("parseImport", () => {
  it("refuses text that is not JSON", () => {
    const result = parseImport("{nope");
    expect(result.ok).toBe(false);
  });

  it("names the row of a bad field", () => {
    const result = parseImport(JSON.stringify({ characters: [{ ...row(), extra: 1 }] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.startsWith("Row 1")).toBe(true);
  });

  it("accepts a row without lists", () => {
    const result = parseImport(JSON.stringify({ characters: [row()] }));
    expect(result.ok).toBe(true);
  });
});

describe("planImport", () => {
  it("marks new rows and skips stored ones", () => {
    const plan = planImport(
      [row({ name: "Alpha" }), row({ name: "Beta" })],
      new Set(["beta"]),
    );
    expect(plan.items.map((i) => i.status)).toEqual(["new", "exists"]);
    expect(plan.ready).toHaveLength(1);
    expect(plan.ready[0]!.aliases).toEqual([]);
  });

  it("gives a version row a slug with its continuity", () => {
    const plan = planImport(
      [
        row({
          name: "Superman",
          entity: "superman",
          media: "live-action",
          continuity: "DCEU",
        }),
      ],
      new Set(),
    );
    expect(plan.items[0]!.slug).toBe("superman-dceu");
  });

  it("refuses values outside the scales", () => {
    const plan = planImport([row({ attackPotency: "99-Z" })], new Set());
    expect(plan.items[0]!.status).toBe("invalid");
    expect(plan.ready).toHaveLength(0);
  });

  it("refuses a slug repeated in the file", () => {
    const plan = planImport([row(), row()], new Set());
    expect(plan.items.map((i) => i.status)).toEqual(["new", "invalid"]);
  });

  it("refuses the same version twice", () => {
    const version = { entity: "alpha", media: "live-action" as const, continuity: "MCU" };
    const plan = planImport(
      [row({ ...version, slug: "alpha-a" }), row({ ...version, slug: "alpha-b" })],
      new Set(),
    );
    expect(plan.items[1]!.status).toBe("invalid");
    expect(plan.items[1]!.reason).toContain("same version");
  });
});

describe("canPublish", () => {
  it("allows a draft with enough verified feats", () => {
    expect(canPublish(3, false).ok).toBe(true);
  });

  it("refuses a draft with too few and says how many are needed", () => {
    const check = canPublish(2, false);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toContain("3");
  });

  it("lets an admin force it", () => {
    expect(canPublish(0, true).ok).toBe(true);
  });
});
