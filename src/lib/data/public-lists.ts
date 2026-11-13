import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { UserList, UserListItem } from "@/lib/data/lists";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { visibilityOf } from "@/lib/lists/rules";

export interface PublicListEntry {
  list: UserList;
  ownerHandle: string;
}

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

/** Newest public lists whose owners have public profiles */
export async function getRecentPublicLists(limit = 20): Promise<PublicListEntry[]> {
  try {
    const db = adminDb();
    const snap = await db
      .collection(COL.lists)
      .where("visibility", "==", "public")
      .where("status", "==", "visible")
      .orderBy("createdAt", "desc")
      .limit(limit * 2)
      .get();
    if (snap.empty) return [];

    const ownerIds = [...new Set(snap.docs.map((doc) => String(doc.get("ownerUid"))))];
    const owners = new Map(
      (await db.getAll(...ownerIds.map((id) => db.collection(COL.users).doc(id)))).map(
        (owner) => [owner.id, owner] as const,
      ),
    );

    return snap.docs
      .flatMap((doc) => {
        const owner = owners.get(String(doc.get("ownerUid")));
        const handle = owner?.get("handle");
        if (typeof handle !== "string" || owner?.get("private") === true) return [];
        return [{ list: toList(doc), ownerHandle: handle }];
      })
      .slice(0, limit);
  } catch (error) {
    console.error("recent lists failed", error);
    return [];
  }
}
