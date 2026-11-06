import { describe, expect, it } from "vitest";
import { exploreHref, parseExplore, stateHref } from "@/lib/explore/params";

const parse = (query: string) => parseExplore(new URLSearchParams(query));

describe("parseExplore", () => {
  it("is the overview with no parameters", () => {
    expect(parse("")).toEqual({ mode: "overview", facet: { kind: "all" }, view: "rows" });
  });

  it("reads a media filter", () => {
    expect(parse("media=anime").facet).toEqual({ kind: "media", media: "anime" });
    expect(parse("media=anime").mode).toBe("list");
  });

  it("ignores an unknown media type", () => {
    expect(parse("media=bogus").mode).toBe("overview");
  });

  it("reads a known tier group and rejects unknown ones", () => {
    expect(parse("tier=3").facet).toEqual({ kind: "tier", group: 3 });
    expect(parse("tier=99").mode).toBe("overview");
    expect(parse("tier=abc").mode).toBe("overview");
  });

  it("shows the full list for all=1", () => {
    expect(parse("all=1")).toEqual({ mode: "list", facet: { kind: "all" }, view: "rows" });
  });

  it("reads the grid view", () => {
    expect(parse("all=1&view=grid").view).toBe("grid");
  });

  it("lets media win when several filters are present", () => {
    expect(parse("tier=3&media=manga").facet).toEqual({ kind: "media", media: "manga" });
  });
});

describe("exploreHref", () => {
  it("builds each address", () => {
    expect(exploreHref({})).toBe("/");
    expect(exploreHref({ all: true })).toBe("/?all=1");
    expect(exploreHref({ media: "anime" })).toBe("/?media=anime");
    expect(exploreHref({ tier: 3 }, "grid")).toBe("/?tier=3&view=grid");
  });

  it("round-trips through parseExplore", () => {
    const state = parse("media=manhwa&view=grid");
    expect(stateHref(state)).toBe("/?media=manhwa&view=grid");
    expect(stateHref(parse(""))).toBe("/");
  });
});