import { describe, expect, it } from "vitest";
import {
  FRESH_SIGN_IN_SECONDS,
  deleteAccountSchema,
  signedInRecently,
} from "@/lib/validation/account";

describe("deleteAccountSchema", () => {
  it("accepts only the exact word", () => {
    expect(deleteAccountSchema.safeParse({ confirm: "DELETE" }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ confirm: "delete" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ confirm: "" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({}).success).toBe(false);
  });

  it("rejects extra fields", () => {
    expect(deleteAccountSchema.safeParse({ confirm: "DELETE", uid: "x" }).success).toBe(
      false,
    );
  });
});

describe("signedInRecently", () => {
  const now = 1_700_000_000_000;

  it("accepts a recent sign-in", () => {
    expect(signedInRecently(now / 1000 - 60, now)).toBe(true);
    expect(signedInRecently(now / 1000 - FRESH_SIGN_IN_SECONDS, now)).toBe(true);
  });

  it("rejects an old or missing sign-in", () => {
    expect(signedInRecently(now / 1000 - FRESH_SIGN_IN_SECONDS - 1, now)).toBe(false);
    expect(signedInRecently(undefined, now)).toBe(false);
    expect(signedInRecently("1", now)).toBe(false);
    expect(signedInRecently(Number.NaN, now)).toBe(false);
  });
});
