import { describe, expect, it } from "vitest";
import { extendUntil, isActive } from "@/lib/plus/rules";

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

describe("isActive", () => {
  it("is active only before the expiry", () => {
    expect(isActive(NOW + 1, NOW)).toBe(true);
    expect(isActive(NOW, NOW)).toBe(false);
    expect(isActive(NOW - 1, NOW)).toBe(false);
  });

  it("ignores missing or broken values", () => {
    expect(isActive(undefined, NOW)).toBe(false);
    expect(isActive("soon", NOW)).toBe(false);
    expect(isActive(null, NOW)).toBe(false);
  });
});

describe("extendUntil", () => {
  it("starts from now when nothing is active", () => {
    expect(extendUntil(undefined, NOW, 30)).toBe(NOW + 30 * DAY);
    expect(extendUntil(NOW - DAY, NOW, 30)).toBe(NOW + 30 * DAY);
  });

  it("keeps the time left on an active period", () => {
    expect(extendUntil(NOW + 10 * DAY, NOW, 30)).toBe(NOW + 40 * DAY);
  });
});
