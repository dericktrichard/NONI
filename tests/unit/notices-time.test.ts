import { describe, expect, it } from "vitest";
import { ago } from "@/lib/notices/time";

const NOW = 1_000_000_000;

describe("ago", () => {
  it("gives no label for an unknown time", () => {
    expect(ago(0, NOW)).toBe("");
  });

  it("says just now inside a minute, even for a clock that is slightly ahead", () => {
    expect(ago(NOW - 30_000, NOW)).toBe("just now");
    expect(ago(NOW + 5_000, NOW)).toBe("just now");
  });

  it("counts minutes, hours and days", () => {
    expect(ago(NOW - 5 * 60_000, NOW)).toBe("5m ago");
    expect(ago(NOW - 3 * 3_600_000, NOW)).toBe("3h ago");
    expect(ago(NOW - 2 * 86_400_000, NOW)).toBe("2d ago");
  });
});
