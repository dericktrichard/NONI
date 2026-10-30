import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { HANDLE_MESSAGES, checkHandle, handleCooldownDays, normalizeHandle } from "@/lib/profile/handle";
import { getPublicLists, type UserList } from "@/lib/data/lists";

export interface PublicProfile {
  handle: string;
  bio: string;
  createdAt: string;
  featsSubmitted: number;
  lists: UserList[];
}

export interface OwnProfile {
  handle: string | null;
  bio: string;
  cooldownDays: number;
}

function millis(value: unknown): number | null {
  const stamp = value as { toMillis?: () => number } | null | undefined;
  return typeof stamp?.toMillis === "function" ? stamp.toMillis() : null;
}

export async function saveProfile(
  uid: string,
  input: { handle: string; bio: string },
): Promise<{ handle: string; previous: string | null }> {
  const handle = normalizeHandle(input.handle);
  const issue = checkHandle(handle);
  if (issue) throw new HttpError(400, HANDLE_MESSAGES[issue]);

  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  const newRef = db.collection(COL.handles).doc(handle);

  return db.runTransaction(async (tx) => {
    const user = await tx.get(userRef);
    const stored = user.get("handle");
    const current = typeof stored === "string" ? stored : null;
    const now = Timestamp.now();

    if (current === handle) {
      tx.set(userRef, { bio: input.bio }, { merge: true });
      return { handle, previous: current };
    }

    const target = await tx.get(newRef);
    if (target.exists) throw new HttpError(409, "That handle is taken.");

    if (current !== null) {
      const days = handleCooldownDays(millis(user.get("handleChangedAt")), Date.now());
      if (days > 0) {
        throw new HttpError(409, `You can change your handle again in ${days} ${days === 1 ? "day" : "days"}.`);
      }
      tx.delete(db.collection(COL.handles).doc(current));
    }

    tx.create(newRef, { uid, createdAt: now });
    tx.set(
      userRef,
      {
        handle,
        bio: input.bio,
        ...(current !== null ? { handleChangedAt: now } : {}),
        ...(user.exists ? {} : { createdAt: now }),
      },
      { merge: true },
    );

    return { handle, previous: current };
  });
}

export async function getOwnProfile(uid: string): Promise<OwnProfile> {
  const user = await adminDb().collection(COL.users).doc(uid).get();
  const handle = user.get("handle");
  return {
    handle: typeof handle === "string" ? handle : null,
    bio: String(user.get("bio") ?? ""),
    cooldownDays: handleCooldownDays(millis(user.get("handleChangedAt")), Date.now()),
  };
}

export async function getProfileByHandle(raw: string): Promise<PublicProfile | null> {
  const handle = normalizeHandle(raw);
  if (checkHandle(handle) !== null) return null;

  const db = adminDb();
  const owner = await db.collection(COL.handles).doc(handle).get();
  if (!owner.exists) return null;

  const uid = String(owner.get("uid"));
  const user = await db.collection(COL.users).doc(uid).get();
  if (!user.exists || user.get("handle") !== handle) return null;

  const created = millis(user.get("createdAt"));
  return {
    handle,
    bio: String(user.get("bio") ?? ""),
    createdAt: created === null ? "" : new Date(created).toISOString(),
    featsSubmitted: Number(user.get("featsSubmitted")) || 0,
    lists: await getPublicLists(uid),
  };
}