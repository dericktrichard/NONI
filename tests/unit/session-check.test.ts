import { afterEach, describe, expect, it, vi } from "vitest";
import { createTrust, isRejection, within } from "@/lib/security/session-check";

afterEach(() => vi.useRealTimers());

describe("isRejection", () => {
  it("recognises a bad cookie", () => {
    for (const code of [
      "auth/session-cookie-expired",
      "auth/session-cookie-revoked",
      "auth/argument-error",
      "auth/user-disabled",
    ])
      expect(isRejection({ code })).toBe(true);
  });

  it("does not treat timeouts or network errors as a bad cookie", () => {
    expect(isRejection({ code: "noni/timeout" })).toBe(false);
    expect(isRejection({ code: "app/network-error" })).toBe(false);
    expect(isRejection(new Error("socket hang up"))).toBe(false);
    expect(isRejection(null)).toBe(false);
  });
});

describe("within", () => {
  it("passes a result through", async () => {
    await expect(within(100, Promise.resolve(5))).resolves.toBe(5);
  });

  it("rejects after the time limit", async () => {
    vi.useFakeTimers();
    const slow = within(100, new Promise<never>(() => undefined));
    const settled = expect(slow).rejects.toMatchObject({ code: "noni/timeout" });
    await vi.advanceTimersByTimeAsync(101);
    await settled;
  });

  it("passes a rejection through", async () => {
    await expect(
      within(
        100,
        Promise.reject(Object.assign(new Error("x"), { code: "auth/argument-error" })),
      ),
    ).rejects.toMatchObject({
      code: "auth/argument-error",
    });
  });
});

describe("trust cache", () => {
  it("forgets an entry after the time to live", () => {
    let now = 0;
    const trust = createTrust<string>(60, 10, () => now);
    trust.set("a", "x");
    expect(trust.get("a")).toBe("x");
    now = 61;
    expect(trust.get("a")).toBeUndefined();
  });

  it("never outlives the given limit", () => {
    let now = 0;
    const trust = createTrust<string>(60, 10, () => now);
    trust.set("a", "x", 30);
    now = 31;
    expect(trust.get("a")).toBeUndefined();
  });

  it("empties itself when full", () => {
    const trust = createTrust<string>(60, 2, () => 0);
    trust.set("a", "x");
    trust.set("b", "y");
    trust.set("c", "z");
    expect(trust.get("a")).toBeUndefined();
    expect(trust.get("c")).toBe("z");
  });
});
