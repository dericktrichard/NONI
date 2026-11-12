import { describe, expect, it } from "vitest";
import { moderateImageSchema, reportImageSchema } from "@/lib/validation/image-moderation";

describe("image moderation input", () => {
  it("needs a note to remove or block but not to dismiss", () => {
    const base = { uid: "abc123", kind: "banner" } as const;
    expect(
      moderateImageSchema.safeParse({ ...base, action: "dismiss", note: "" }).success,
    ).toBe(true);
    expect(
      moderateImageSchema.safeParse({ ...base, action: "remove", note: "" }).success,
    ).toBe(false);
    expect(
      moderateImageSchema.safeParse({ ...base, action: "block", note: "explicit" })
        .success,
    ).toBe(true);
  });

  it("rejects unknown fields, kinds and ids", () => {
    const ok = { uid: "abc123", kind: "avatar", reason: "sexual", note: "" };
    expect(reportImageSchema.safeParse(ok).success).toBe(true);
    expect(reportImageSchema.safeParse({ ...ok, extra: 1 }).success).toBe(false);
    expect(reportImageSchema.safeParse({ ...ok, kind: "cover" }).success).toBe(false);
    expect(reportImageSchema.safeParse({ ...ok, uid: "../x" }).success).toBe(false);
  });
});
