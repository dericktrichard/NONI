import "server-only";
import type { Query } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import type { QueryPlan } from "./query";
import { SUMMARY_FIELDS, assemblePage, type CharacterPage } from "./summary";

/**
 * Reads one page of the ranking. Always ordered by rank, which is unique, so
 * pages never overlap or skip, and the order matches the engine exactly.
 * Each filter below is served by one composite index in firebase/firestore.indexes.json.
 */
export async function fetchCharacters(plan: QueryPlan): Promise<CharacterPage> {
  let query: Query = adminDb().collection(COL.characters);

  if (plan.where) query = query.where(plan.where.field, plan.where.op, plan.where.value);
  query = query.orderBy("rank", "asc");
  if (plan.after !== null) query = query.startAfter(plan.after);

  const snapshot = await query
    .select(...SUMMARY_FIELDS)
    .limit(plan.fetch)
    .get();

  return assemblePage(
    snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })),
    plan.limit,
  );
}
