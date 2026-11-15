import { describe, expect, it } from "vitest";
import {
  bestPerEntity,
  entityKey,
  groupVersions,
  hasDuplicateEntity,
  sharedEntities,
  versionLabel,
} from "@/lib/versions/rules";

const row = (id: string, score: number, entity?: string) => ({ id, score, entity });

describe("versionLabel", () => {
  it("names the medium", () => {
    expect(versionLabel("comic")).toBe("Comics");
  });
  it("adds the continuity", () => {
    expect(versionLabel("live-action", "DCEU")).toBe("Live-action, DCEU");
  });
  it("ignores a blank continuity", () => {
    expect(versionLabel("live-action", "  ")).toBe("Live-action");
  });
});

describe("entityKey", () => {
  it("falls back to the id", () => {
    expect(entityKey(row("goku", 1))).toBe("goku");
    expect(entityKey(row("superman-live-action", 1, "superman"))).toBe("superman");
  });
});

describe("bestPerEntity", () => {
  it("keeps the best version and the order", () => {
    const items = [
      row("superman", 9000),
      row("goku", 8000),
      row("superman-live-action", 5000, "superman"),
    ];
    expect(bestPerEntity(items).map((i) => i.id)).toEqual(["superman", "goku"]);
  });
  it("keeps a stronger version that appears later", () => {
    const items = [row("a-film", 5000, "a"), row("b", 4000), row("a", 9000)];
    expect(bestPerEntity(items).map((i) => i.id)).toEqual(["b", "a"]);
  });
  it("leaves unrelated characters alone", () => {
    const items = [row("a", 3), row("b", 2), row("c", 1)];
    expect(bestPerEntity(items)).toHaveLength(3);
  });
});

describe("groupVersions", () => {
  it("puts versions of one entity together", () => {
    const items = [row("a", 3, "a"), row("b", 2), row("a-film", 1, "a")];
    expect(groupVersions(items).map((i) => i.id)).toEqual(["a", "a-film", "b"]);
  });
});

describe("sharedEntities", () => {
  it("finds entities that appear twice", () => {
    const items = [row("a", 3), row("b", 2), row("a-film", 1, "a")];
    expect([...sharedEntities(items)]).toEqual(["a"]);
  });
});

describe("hasDuplicateEntity", () => {
  it("detects two versions of one entity", () => {
    expect(hasDuplicateEntity(["a", "b", "a"])).toBe(true);
    expect(hasDuplicateEntity(["a", "b"])).toBe(false);
  });
});
