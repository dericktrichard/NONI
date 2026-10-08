import "server-only";
import { createHash } from "node:crypto";

export const pseudonymFor = (uid: string) =>
  `user-${createHash("sha256").update(`noni:${uid}`).digest("hex").slice(0, 8)}`;