import "server-only";
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { MAX_LISTS } from "@/lib/lists/rules";
import type { ListInput } from "@/lib/validation/list";

export interface ListItem {
  characterId: string;
  name: string;
  reason: string;
}

export interface UserList {
  id: string;
  title: string;
  items: ListItem[];
}

export interface CharacterOption {
  id: string;
  name: string;
}

async function resolveItems(db: Firestore, input: ListInput): Promise<ListItem[]> {
  const refs = input.items.map((item) => db.collection(COL.characters).doc(item.characterId));
  const snaps = await db.getAll(...refs);
  return input.items.map((item, index) => {
    const snap = snaps[index];
    if (!snap || !snap.exists) throw new HttpError(400, "One of the characters does not exist.");
    return {
      characterId: item.characterId,
      name: String(snap.get("name") ?? item.characterId),
      reason: item.reason,
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
    .filter((doc) => !publicOnly || doc.get("status") === "visible")
    .sort((a, b) => createdMillis(a.get("createdAt")) - createdMillis(b.get("createdAt")))
    .slice(0, MAX_LISTS)
    .map((doc) => ({
      id: doc.id,
      title: String(doc.get("title") ?? ""),
      items: ((doc.get("items") as ListItem[] | undefined) ?? []).map((item) => ({
        characterId: String(item.characterId),
        name: String(item.name),
        reason: String(item.reason),
      })),
    }));
}

export const getOwnLists = (uid: string) => loadLists(uid, false);
export const getPublicLists = (uid: string) => loadLists(uid, true);

export async function listCharacterOptions(): Promise<CharacterOption[]> {
  const snap = await adminDb().collection(COL.characters).select("name").limit(500).get();
  return snap.docs
    .map((doc) => ({ id: doc.id, name: String(doc.get("name") ?? doc.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}