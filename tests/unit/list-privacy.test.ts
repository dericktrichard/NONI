import { describe, expect, it } from "vitest";
import { listVisibility } from "@/lib/lists/rules";

describe("listVisibility", () => {
  it("forces private lists on a private account and keeps the choice otherwise", () => {
    expect(listVisibility(true, "public")).toBe("private");
    expect(listVisibility(true, "private")).toBe("private");
    expect(listVisibility(false, "public")).toBe("public");
    expect(listVisibility(false, "private")).toBe("private");
  });
});
