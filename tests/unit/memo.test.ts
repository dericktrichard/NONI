import { describe, expect, it } from "vitest";
import { memoAsync } from "@/lib/cache/memo";

describe("memoAsync", () => {
  it("reuses the result until it expires", async () => {
    let now = 0;
    let calls = 0;
    const get = memoAsync(
      60,
      async () => ++calls,
      () => now,
    );
    expect(await get()).toBe(1);
    now = 30;
    expect(await get()).toBe(1);
    now = 61;
    expect(await get()).toBe(2);
  });

  it("shares one load between simultaneous callers", async () => {
    let calls = 0;
    const get = memoAsync(60, async () => ++calls);
    const [a, b] = await Promise.all([get(), get()]);
    expect(a).toBe(b);
    expect(calls).toBe(1);
  });

  it("does not keep a failure", async () => {
    let calls = 0;
    const get = memoAsync(60, async () => {
      calls += 1;
      if (calls === 1) throw new Error("down");
      return calls;
    });
    await expect(get()).rejects.toThrow("down");
    expect(await get()).toBe(2);
  });
});
