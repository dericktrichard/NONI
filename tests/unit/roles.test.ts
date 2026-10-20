import { describe, expect, it } from "vitest";
import { hasRole, roleOf } from "@/lib/security/roles";

describe("roleOf", () => {
  it("reads the known roles", () => {
    expect(roleOf({ role: "admin" })).toBe("admin");
    expect(roleOf({ role: "moderator" })).toBe("moderator");
  });

  it("treats anything else as a plain user", () => {
    for (const role of [undefined, null, "", "Admin", "superuser", 1, true, {}, ["admin"]]) {
      expect(roleOf({ role })).toBe("user");
    }
    expect(roleOf({})).toBe("user");
  });
});

describe("hasRole", () => {
  it("lets admins do everything and moderators only moderator work", () => {
    expect(hasRole({ role: "admin" }, "admin")).toBe(true);
    expect(hasRole({ role: "admin" }, "moderator")).toBe(true);
    expect(hasRole({ role: "moderator" }, "moderator")).toBe(true);
    expect(hasRole({ role: "moderator" }, "admin")).toBe(false);
  });

  it("denies users and unknown values", () => {
    expect(hasRole({}, "moderator")).toBe(false);
    expect(hasRole({ role: "root" }, "moderator")).toBe(false);
  });
});