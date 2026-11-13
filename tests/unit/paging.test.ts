import { describe, expect, it } from "vitest";
import { parseCursor, parseOffset } from "@/lib/paging/rules";

describe("parseCursor", () => {
  it("treats a missing cursor as the first page", () => {
    expect(parseCursor(null)).toEqual({ ok: true, value: null });
    expect(parseCursor("")).toEqual({ ok: true, value: null });
  });

  it("accepts a document id and refuses anything else", () => {
    expect(parseCursor("aB3dE5gH7jK9mN1pQ3rS")).toEqual({
      ok: true,
      value: "aB3dE5gH7jK9mN1pQ3rS",
    });
    expect(parseCursor("../users/abc")).toEqual({ ok: false });
    expect(parseCursor("short")).toEqual({ ok: false });
  });
});

describe("parseOffset", () => {
  it("defaults to zero and accepts whole numbers up to the limit", () => {
    expect(parseOffset(null)).toEqual({ ok: true, value: 0 });
    expect(parseOffset("12")).toEqual({ ok: true, value: 12 });
    expect(parseOffset("500")).toEqual({ ok: true, value: 500 });
  });

  it("refuses negatives, text and values past the limit", () => {
    for (const raw of ["-1", "1.5", "abc", "501", "99999"])
      expect(parseOffset(raw)).toEqual({ ok: false });
  });
});
