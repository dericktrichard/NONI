import "server-only";
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import type { ListInput } from "@/lib/validation/list";
import { MAX_LISTS, visibilityOf, withoutCharacter, type Visibility } from "@/lib/lists/rules";
import type { ListStatus } from "@/lib/lists/moderation";

export interface ListItem {
  characterId: string;
  name: string;
  reason: string;
}

export interface UserListItem extends ListItem {
  imageUrl: string | null;
}

export interface UserList {
  id: string;
  title: string;
  items: UserListItem[];
  status: ListStatus;
  visibility: Visibility;
}

const image = (value: unknown): string | null =>
  typeof value === "string" && value.startsWith("https://") ? value : null;

async function resolveItems(db: Firestore, input: ListInput): Promise<UserListItem[]> {
  const refs = input.items.map((item) => db.collection(COL.characters).doc(item.characterId));
  const snaps = await db.getAll(...refs);
  return input.items.map((item, index) => {
    const snap = snaps[index];
    if (!snap || !snap.exists) throw new HttpError(400, "One of the characters does not exist.");
    return {
      characterId: item.characterId,
      name: String(snap.get("name") ?? item.characterId),
      reason: item.reason,
      imageUrl: image(snap.get("imageUrl")),
    };
  });
}

export async function createList(uid: string, input: ListInput): Promise<{ id: string; handle: string }> {
  const db = adminDb();
  const items = await resolveItems(db, input);
  const userRef = db.collection(COL.users).doc(uid);
  const listRef = db.collection(COL.lists).doc();

  const handle = await db.runTransaction(async (tx) => {
    const user = await tx.get(userRef);
    const stored = user.get("handle");
    if (typeof stored !== "string") throw new HttpError(409, "Set a handle in your profile first.");
    const count = Number(user.get("listCount")) || 0;
    if (count >= MAX_LISTS) throw new HttpError(409, `You can keep up to ${MAX_LISTS} lists.`);

    const now = Timestamp.now();
    tx.create(listRef, {
      ownerUid: uid,
      title: input.title,
      visibility: input.visibility,
      items,
      characterIds: items.map((item) => item.characterId),
      status: "visible",
      openReports: 0,
      createdAt: now,
      updatedAt: now,
    });
    tx.set(userRef, { listCount: count + 1 }, { merge: true });
    return stored;
  });

  return { id: listRef.id, handle };
}

export async function updateList(uid: string, listId: string, input: ListInput): Promise<{ handle: string }> {
  const db = adminDb();
  const items = await resolveItems(db, input);
  const listRef = db.collection(COL.lists).doc(listId);
  const userRef = db.collection(COL.users).doc(uid);

  return db.runTransaction(async (tx) => {
    const list = await tx.get(listRef);
    if (!list.exists || list.get("ownerUid") !== uid) throw new HttpError(404, "List not found.");
    const user = await tx.get(userRef);

    tx.update(listRef, {
      title: input.title,
      visibility: input.visibility,
      items,
      characterIds: items.map((item) => item.characterId),
      updatedAt: Timestamp.now(),
    });
    return { handle: String(user.get("handle") ?? "") };
  });
}

export async function deleteList(uid: string, listId: string): Promise<{ handle: string }> {
  const db = adminDb();
  const listRef = db.collection(COL.lists).doc(listId);
  const userRef = db.collection(COL.users).doc(uid);

  return db.runTransaction(async (tx) => {
    const list = await tx.get(listRef);
    if (!list.exists || list.get("ownerUid") !== uid) throw new HttpError(404, "List not found.");
    const user = await tx.get(userRef);
    const count = Number(user.get("listCount")) || 0;

    tx.delete(listRef);
    tx.set(userRef, { listCount: Math.max(0, count - 1) }, { merge: true });
    return { handle: String(user.get("handle") ?? "") };
  });
}

function createdMillis(value: unknown): number {
  const stamp = value as { toMillis?: () => number } | null | undefined;
  return typeof stamp?.toMillis === "function" ? stamp.toMillis() : 0;
}

async function loadLists(uid: string, publicOnly: boolean): Promise<UserList[]> {
  const snap = await adminDb()
    .collection(COL.lists)
    .where("ownerUid", "==", uid)
    .limit(MAX_LISTS + 5)
    .get();

  return snap.docs
    .filter((doc) => !publicOnly || (doc.get("status") === "visible" && visibilityOf(doc.get("visibility")) === "public"))
    .sort((a, b) => createdMillis(a.get("createdAt")) - createdMillis(b.get("createdAt")))
    .slice(0, MAX_LISTS)
    .map((doc) => ({
      id: doc.id,
      title: String(doc.get("title") ?? ""),
      status: (doc.get("status") === "hidden" ? "hidden" : "visible") as ListStatus,
      visibility: visibilityOf(doc.get("visibility")),
      items: ((doc.get("items") as Array<Partial<UserListItem>> | undefined) ?? []).map((item) => ({
        characterId: String(item.characterId),
        name: String(item.name),
        reason: String(item.reason),
        imageUrl: image(item.imageUrl),
      })),
    }));
}

export const getOwnLists = (uid: string) => loadLists(uid, false);
export const getPublicLists = (uid: string) => loadLists(uid, true);

export async function removeCharacterFromLists(characterId: string): Promise<void> {
  const db = adminDb();
  const snap = await db.collection(COL.lists).where("characterIds", "array-contains", characterId).limit(500).get();

  for (const doc of snap.docs) {
    const items = withoutCharacter((doc.get("items") as ListItem[] | undefined) ?? [], characterId);
    if (items.length > 0) {
      await doc.ref.update({
        items,
        characterIds: items.map((item) => item.characterId),
        updatedAt: Timestamp.now(),
      });
      continue;
    }

    const userRef = db.collection(COL.users).doc(String(doc.get("ownerUid")));
    await db.runTransaction(async (tx) => {
      const user = await tx.get(userRef);
      const count = Number(user.get("listCount")) || 0;
      tx.delete(doc.ref);
      tx.set(userRef, { listCount: Math.max(0, count - 1) }, { merge: true });
    });
  }
}