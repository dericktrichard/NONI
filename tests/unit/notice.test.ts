import { describe, expect, it } from "vitest";
import { noticeSchema } from "@/lib/validation/notice";

describe("notice schema", () => {
  it("accepts a filled notice", () => {
    const result = noticeSchema.safeParse({
      enabled: true,
      title: "Welcome",
      body: "A short message for everyone.\nThank you.",
    });
    expect(result.success).toBe(true);
  });

  it("allows an empty notice while it is switched off", () => {
    expect(noticeSchema.safeParse({ enabled: false, title: "", body: "" }).success).toBe(
      true,
    );
  });

  it("refuses to switch on without a title and a message", () => {
    expect(noticeSchema.safeParse({ enabled: true, title: "", body: "" }).success).toBe(
      false,
    );
    expect(
      noticeSchema.safeParse({ enabled: true, title: "Hi there", body: "short" }).success,
    ).toBe(false);
  });

  it("refuses unknown keys and over-long text", () => {
    expect(
      noticeSchema.safeParse({ enabled: false, title: "", body: "", extra: 1 }).success,
    ).toBe(false);
    expect(
      noticeSchema.safeParse({ enabled: false, title: "", body: "x".repeat(601) })
        .success,
    ).toBe(false);
  });
});
