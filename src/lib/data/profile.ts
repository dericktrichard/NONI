import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { listFavourites, type FavouriteCard } from "@/lib/data/favourites";
import { getPublicLists, type UserList } from "@/lib/data/lists";
import { setBoards } from "@/lib/data/standing";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import {
  HANDLE_MESSAGES,
  checkHandle,
  handleCooldownDays,
  normalizeHandle,
} from "@/lib/profile/handle";
import { readLook, type Look } from "@/lib/profile/look";

export interface PublicProfile {
  handle: string;
  bio: string;
  createdAt: string;
  featsSubmitted: number;
  favouriteCount: number;
  look: Look;
  favourites: FavouriteCard[];
  lists: UserList[];
  private: boolean;
}

export interface OwnProfile {
  handle: string | null;
  bio: string;
  cooldownDays: number;
  private: boolean;
}

function millis(value: unknown): number | null {
  const stamp = value as { toMillis?: () => number } | null | undefined;
  return typeof stamp?.toMillis === "function" ? stamp.toMillis() : null;
}

export async function saveProfile(
  uid: string,
  input: { handle: string; bio: string; private?: boolean },
): Promise<{ handle: string; previous: string | null }> {
  const handle = normalizeHandle(input.handle);
  const issue = checkHandle(handle);
  if (issue) throw new HttpError(400, HANDLE_MESSAGES[issue]);

  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  const newRef = db.collection(COL.handles).doc(handle);

  const result = await db.runTransaction(async (tx) => {
    const user = await tx.get(userRef);
    const stored = user.get("handle");
    const current = typeof stored === "string" ? stored : null;
    const now = Timestamp.now();
    const visibility = input.private === undefined ? {} : { private: input.private };
    const hid = input.private === true && user.get("private") !== true;

    if (current === handle) {
      tx.set(userRef, { bio: input.bio, ...visibility }, { merge: true });
      return { handle, previous: current, hid };
    }

    const target = await tx.get(newRef);
    if (target.exists) throw new HttpError(409, "That handle is taken.");

    if (current !== null) {
      const days = handleCooldownDays(millis(user.get("handleChangedAt")), Date.now());
      if (days > 0) {
        throw new HttpError(
          409,
          `You can change your handle again in ${days} ${days === 1 ? "day" : "days"}.`,
        );
      }
      tx.delete(db.collection(COL.handles).doc(current));
    }

    tx.create(newRef, { uid, createdAt: now });
    tx.set(
      userRef,
      {
        handle,
        bio: input.bio,
        ...visibility,
        ...(current !== null ? { handleChangedAt: now } : {}),
        ...(user.exists ? {} : { createdAt: now }),
      },
      { merge: true },
    );

    return { handle, previous: current, hid };
  });

  if (result.hid) await setBoards(uid, false);
  return { handle: result.handle, previous: result.previous };
}

export async function getOwnProfile(uid: string): Promise<OwnProfile> {
  const user = await adminDb().collection(COL.users).doc(uid).get();
  const handle = user.get("handle");
  return {
    handle: typeof handle === "string" ? handle : null,
    bio: String(user.get("bio") ?? ""),
    cooldownDays: handleCooldownDays(millis(user.get("handleChangedAt")), Date.now()),
    private: user.get("private") === true,
  };
}

/** A private profile comes back as an empty shell unless the caller is allowed to see it */
export async function getProfileByHandle(
  raw: string,
  includePrivate = false,
): Promise<PublicProfile | null> {
  const handle = normalizeHandle(raw);
  if (checkHandle(handle) !== null) return null;

  const db = adminDb();
  const owner = await db.collection(COL.handles).doc(handle).get();
  if (!owner.exists) return null;

  const uid = String(owner.get("uid"));
  const user = await db.collection(COL.users).doc(uid).get();
  if (!user.exists || user.get("handle") !== handle) return null;

  const hidden = user.get("private") === true;
  if (hidden && !includePrivate) {
    return {
      handle,
      bio: "",
      createdAt: "",
      featsSubmitted: 0,
      favouriteCount: 0,
      look: readLook({}),
      favourites: [],
      lists: [],
      private: true,
    };
  }

  const [lists, favourites] = await Promise.all([
    getPublicLists(uid),
    listFavourites(uid),
  ]);
  const created = millis(user.get("createdAt"));

  return {
    handle,
    bio: String(user.get("bio") ?? ""),
    createdAt: created === null ? "" : new Date(created).toISOString(),
    featsSubmitted: Number(user.get("featsSubmitted")) || 0,
    favouriteCount: Number(user.get("favouriteCount")) || 0,
    look: readLook(user.data() ?? {}),
    favourites,
    lists,
    private: hidden,
  };
}
