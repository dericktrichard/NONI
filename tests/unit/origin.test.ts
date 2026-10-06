import { describe, expect, it } from "vitest";
import { isSameOrigin } from "@/lib/security/origin";

const make = (origin?: string) =>
  new Request("https://noni.example/api/auth/session", {
    method: "POST",
    headers: origin ? { origin } : {},
  });

describe("isSameOrigin", () => {
  it("accepts the exact origin", () => {
    expect(isSameOrigin(make("https://noni.example"))).toBe(true);
  });

  it("rejects a missing origin", () => {
    expect(isSameOrigin(make())).toBe(false);
  });

  it("rejects other hosts, schemes, ports and lookalikes", () => {
    for (const origin of [
      "https://evil.example",
      "http://noni.example",
      "https://noni.example:8443",
      "https://noni.example.evil.example",
      "null",
    ]) {
      expect(isSameOrigin(make(origin))).toBe(false);
    }
  });
});