import { describe, expect, it } from "vitest";
import { getClientIp } from "@/lib/security/client-ip";
import { createMemoryLimiter, decide } from "@/lib/security/rate-limit-core";

describe("decide", () => {
  it("allows up to the limit then blocks with a retry time", () => {
    let state = undefined as ReturnType<typeof decide>["next"] | undefined;
    for (let i = 0; i < 3; i++) {
      const result = decide(state, 1000 + i, 3, 60_000);
      expect(result.allowed).toBe(true);
      state = result.next;
    }
    const blocked = decide(state, 5000, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(56);
    expect(blocked.next.count).toBe(3);
  });

  it("starts a fresh window once the old one has passed", () => {
    const result = decide({ count: 3, start: 1000 }, 61_000, 3, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.next).toEqual({ count: 1, start: 61_000 });
  });

  it("resets if the stored start is in the future", () => {
    const result = decide({ count: 99, start: 9_999_999 }, 1000, 3, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.next.count).toBe(1);
  });
});

describe("createMemoryLimiter", () => {
  it("tracks keys independently", () => {
    const limit = createMemoryLimiter(1, 60_000);
    expect(limit("a", 0).allowed).toBe(true);
    expect(limit("a", 1).allowed).toBe(false);
    expect(limit("b", 1).allowed).toBe(true);
  });

  it("stays bounded and refuses new keys when full of live windows", () => {
    const limit = createMemoryLimiter(5, 60_000, 3);
    for (const key of ["a", "b", "c"]) expect(limit(key, 0).allowed).toBe(true);
    expect(limit("d", 1).allowed).toBe(false);
    expect(limit("a", 1).allowed).toBe(true);
  });

  it("frees expired keys to make room", () => {
    const limit = createMemoryLimiter(5, 1000, 2);
    limit("a", 0);
    limit("b", 0);
    expect(limit("c", 5000).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  const make = (headers: Record<string, string>) => new Request("https://noni.example/", { headers });

  it("uses the first forwarded address", () => {
    expect(getClientIp(make({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }))).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip and accepts IPv6", () => {
    expect(getClientIp(make({ "x-real-ip": "2001:db8::1" }))).toBe("2001:db8::1");
  });

  it("returns unknown for missing or malformed values", () => {
    expect(getClientIp(make({}))).toBe("unknown");
    expect(getClientIp(make({ "x-forwarded-for": "<script>" }))).toBe("unknown");
  });
});