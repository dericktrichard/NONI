import "server-only";
import type { DocumentSnapshot, Query } from "firebase-admin/firestore";
import type { UserList, UserListItem } from "@/lib/data/lists";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { visibilityOf } from "@/lib/lists/rules";
import { PAGE, type Page } from "@/lib/paging/rules";

export interface PublicListEntry {
  list: UserList;
  ownerHandle: string;
}

/** Batches read per page when many lists belong to private owners */
const MAX_ROUNDS = 3;

const image = (value: unknown): string | null =>
  typeof value === "string" && value.startsWith("https://") ? value : null;

function toList(doc: DocumentSnapshot): UserList {
  return {
    id: doc.id,
    title: String(doc.get("title") ?? ""),
    status: "visible",
    visibility: visibilityOf(doc.get("visibility")),
    items: ((doc.get("items") as Array<Partial<UserListItem>> | undefined) ?? []).map(
      (item) => ({
        characterId: String(item.characterId),
        name: String(item.name),
        reason: String(item.reason),
        imageUrl: image(item.imageUrl),
      }),
    ),
  };
}

/**
 * Newest public lists whose owners have public profiles, one page at a time.
 * The cursor is the id of the last list scanned, so a list added meanwhile never repeats or shifts a page.
 */
export async function getPublicListPage(
  cursor: string | null,
  limit = PAGE,
): Promise<Page<PublicListEntry, string>> {
  try {
    const db = adminDb();
    let last: DocumentSnapshot | null = null;
    if (cursor) {
      const start = await db.collection(COL.lists).doc(cursor).get();
      if (!start.exists) return { items: [], next: null };
      last = start;
    }

    const batch = limit * 2;
    const items: PublicListEntry[] = [];
    let next: string | null = null;

    for (let round = 0; round < MAX_ROUNDS && items.length < limit; round += 1) {
      let query: Query = db
        .collection(COL.lists)
        .where("visibility", "==", "public")
        .where("status", "==", "visible")
        .orderBy("createdAt", "desc")
        .limit(batch);
      if (last) query = query.startAfter(last);

      const snap = await query.get();
      if (snap.empty) {
        next = null;
        break;
      }

      const ownerIds = [...new Set(snap.docs.map((doc) => String(doc.get("ownerUid"))))];
      const owners = new Map(
        (await db.getAll(...ownerIds.map((id) => db.collection(COL.users).doc(id)))).map(
          (owner) => [owner.id, owner] as const,
        ),
      );

      let stopped = false;
      for (const doc of snap.docs) {
        last = doc;
        const owner = owners.get(String(doc.get("ownerUid")));
        const handle = owner?.get("handle");
        if (typeof handle === "string" && owner?.get("private") !== true)
          items.push({ list: toList(doc), ownerHandle: handle });
        if (items.length === limit) {
          stopped = true;
          break;
        }
      }

      next = stopped || snap.size === batch ? last!.id : null;
      if (!stopped && snap.size < batch) break;
    }

    return { items, next };
  } catch (error) {
    console.error("public lists failed", error);
    return { items: [], next: null };
  }
}
