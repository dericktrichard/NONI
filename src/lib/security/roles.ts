export type Role = "user" | "moderator" | "admin";

export function roleOf(claims: object): Role {
  const role = (claims as { role?: unknown }).role;
  if (role === "admin") return "admin";
  if (role === "moderator") return "moderator";
  return "user";
}

export function hasRole(claims: object, needed: "moderator" | "admin"): boolean {
  const role = roleOf(claims);
  return needed === "moderator" ? role !== "user" : role === "admin";
}