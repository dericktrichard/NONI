import "server-only";
import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { decide, type Decision, type WindowState } from "@/lib/security/rate-limit-core";

export const hashKey = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 40);

export async function consume(scope: string, id: string, limit: number, windowMs: number): Promise<Decision> {
  const db = adminDb();
  const ref = db.collection(COL.rateLimits).doc(hashKey(`${scope}:${id}`));

  return db.runTransaction(async (tx) => {
    const data = (await tx.get(ref)).data();
    const count = Number(data?.count);
    const start = Number(data?.start);
    const state: WindowState | undefined = Number.isFinite(count) && Number.isFinite(start) ? { count, start } : undefined;

    const decision = decide(state, Date.now(), limit, windowMs);
    if (decision.allowed) {
      tx.set(ref, {
        count: decision.next.count,
        start: decision.next.start,
        expiresAt: Timestamp.fromMillis(decision.next.start + windowMs * 2),
      });
    }
    return decision;
  });
}