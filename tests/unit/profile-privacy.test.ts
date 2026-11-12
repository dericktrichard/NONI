import { describe, expect, it } from "vitest";
import { canViewProfile } from "@/lib/profile/visibility";
import { profileSchema } from "@/lib/validation/profile";

describe("profile privacy", () => {
  it("shows a private profile only to its owner and staff", () => {
    expect(canViewProfile(false, false, false)).toBe(true);
    expect(canViewProfile(true, false, false)).toBe(false);
    expect(canViewProfile(true, true, false)).toBe(true);
    expect(canViewProfile(true, false, true)).toBe(true);
  });

  it("accepts an optional private flag and nothing else new", () => {
    const base = { handle: "aprel_test", bio: "" };
    expect(profileSchema.safeParse(base).success).toBe(true);
    expect(profileSchema.safeParse({ ...base, private: true }).success).toBe(true);
    expect(profileSchema.safeParse({ ...base, private: "yes" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, extra: 1 }).success).toBe(false);
  });
});
