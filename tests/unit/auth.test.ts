import { describe, expect, it } from "vitest";
import { SessionError, describeAuthError } from "@/lib/auth/errors";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

describe("auth validation", () => {
  it("normalises the email", () => {
    const parsed = signUpSchema.parse({ email: "  Test@Example.COM ", password: "a".repeat(10) });
    expect(parsed.email).toBe("test@example.com");
  });

  it("requires 10 to 128 characters for a new password", () => {
    expect(signUpSchema.safeParse({ email: "a@b.co", password: "a".repeat(9) }).success).toBe(false);
    expect(signUpSchema.safeParse({ email: "a@b.co", password: "a".repeat(10) }).success).toBe(true);
    expect(signUpSchema.safeParse({ email: "a@b.co", password: "a".repeat(129) }).success).toBe(false);
  });

  it("accepts any existing password up to the limit when signing in", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });

  it("rejects malformed emails", () => {
    for (const email of ["", "nope", "a@", "@b.co", "a b@c.co"]) {
      expect(signInSchema.safeParse({ email, password: "x" }).success).toBe(false);
    }
  });
});

describe("describeAuthError", () => {
  it("gives the same message for unknown email and wrong password", () => {
    const a = describeAuthError({ code: "auth/user-not-found" });
    const b = describeAuthError({ code: "auth/wrong-password" });
    const c = describeAuthError({ code: "auth/invalid-credential" });
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("stays silent when the user closes the popup", () => {
    expect(describeAuthError({ code: "auth/popup-closed-by-user" })).toBe("");
  });

  it("handles session failures and unknown errors without leaking details", () => {
    expect(describeAuthError(new SessionError())).toMatch(/session/i);
    expect(describeAuthError(new Error("secret internals"))).toBe("Something went wrong. Try again.");
    expect(describeAuthError(null)).toBe("Something went wrong. Try again.");
  });
});