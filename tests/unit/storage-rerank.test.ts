import { describe, expect, it } from "vitest";
import type { FieldEntry } from "@/lib/ranking/field";
import { planRerank, type ExistingRank } from "@/lib/ranking/rerank-plan";
import { detectImageType } from "@/lib/storage/image-type";

const bytes = (...values: number[]) => new Uint8Array([...values, ...new Array(Math.max(0, 16 - values.length)).fill(0)]);

describe("detectImageType", () => {
  it("recognises jpeg, png and webp by their first bytes", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg");
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("png");
    const webp = bytes(...[..."RIFF"].map((c) => c.charCodeAt(0)), 0, 0, 0, 0, ...[..."WEBP"].map((c) => c.charCodeAt(0)));
    expect(detectImageType(webp)).toBe("webp");
  });

  it("rejects svg, gif, html and short or empty input", () => {
    const text = (value: string) => new TextEncoder().encode(value.padEnd(16, " "));
    expect(detectImageType(text("<svg xmlns='x'></svg>"))).toBeNull();
    expect(detectImageType(text("GIF89a"))).toBeNull();
    expect(detectImageType(text("<html><script>"))).toBeNull();
    expect(detectImageType(new Uint8Array(0))).toBeNull();
    expect(detectImageType(bytes(0xff, 0xd8))).toBeNull();
  });

  it("does not accept a RIFF file that is not webp", () => {
    const wav = bytes(...[..."RIFF"].map((c) => c.charCodeAt(0)), 0, 0, 0, 0, ...[..."WAVE"].map((c) => c.charCodeAt(0)));
    expect(detectImageType(wav)).toBeNull();
  });
});

const entry = (slug: string, score: number): FieldEntry => ({
  slug,
  name: slug,
  verifiedFeatCount: 0,
  winRate: score / 10000,
  score,
  wins: 1,
  losses: 1,
  even: 0,
  opponents: 2,
});

const stored = (rank: number | null, score: number): ExistingRank => ({ rank, score, winRate: score / 10000, wins: 1, losses: 1 });

describe("planRerank", () => {
  it("assigns ranks in order and remembers the previous rank when it moves", () => {
    const ranked = [entry("a", 9000), entry("b", 8000)];
    const existing = new Map([
      ["a", stored(2, 8500)],
      ["b", stored(1, 8600)],
    ]);
    const updates = planRerank(ranked, existing);
    expect(updates.map((u) => [u.slug, u.rank, u.previousRank])).toEqual([
      ["a", 1, 2],
      ["b", 2, 1],
    ]);
  });

  it("skips characters whose numbers did not change", () => {
    const ranked = [entry("a", 9000), entry("b", 8000)];
    const existing = new Map([
      ["a", stored(1, 9000)],
      ["b", stored(2, 8000)],
    ]);
    expect(planRerank(ranked, existing)).toEqual([]);
  });

  it("includes a brand new character without a previous rank", () => {
    const updates = planRerank([entry("new", 5000)], new Map([["new", stored(null, 0)]]));
    expect(updates.length).toBe(1);
    expect(updates[0].rank).toBe(1);
    expect("previousRank" in updates[0]).toBe(false);
  });

  it("keeps the old previous rank when only the score changes", () => {
    const updates = planRerank([entry("a", 9100)], new Map([["a", stored(1, 9000)]]));
    expect(updates[0].rank).toBe(1);
    expect("previousRank" in updates[0]).toBe(false);
  });
});