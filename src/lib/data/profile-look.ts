import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { deleteUserImage, putUserImage } from "@/lib/storage/r2";
import type { LookInput } from "@/lib/validation/look";

type Kind = "avatar" | "banner";

function imageOf(snap: DocumentSnapshot | null): string | null {
  const url = snap?.get("imageUrl");
  return typeof url === "string" && url.startsWith("https://") ? url : null;
}

const held = (user: DocumentSnapshot, kind: Kind): string | null => {
  const value = user.get(`${kind}Key`);
  return typeof value === "string" ? value : null;
};

async function discard(url: string | null): Promise<void> {
  if (!url) return;
  try {
    await deleteUserImage(url);
  } catch (error) {
    console.error("old image delete failed", error);
  }
}

/** Saves the chosen look. An uploaded picture is kept only when the form says so, otherwise it is replaced and deleted. */
export async function saveLook(uid: string, input: LookInput): Promise<void> {
  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  const current = await userRef.get();
  const oldAvatar = held(current, "avatar");
  const oldBanner = held(current, "banner");
  const keepAvatar = input.avatarUpload && oldAvatar !== null;
  const keepBanner = input.bannerUpload && oldBanner !== null;

  const wanted = [
    ...new Set(
      [keepAvatar ? null : input.avatarId, keepBanner ? null : input.bannerId].filter(
        (id): id is string => id !== null,
      ),
    ),
  ];
  const snaps =
    wanted.length > 0
      ? await db.getAll(...wanted.map((id) => db.collection(COL.characters).doc(id)))
      : [];
  const byId = new Map(
    snaps.filter((snap) => snap.exists).map((snap) => [snap.id, snap] as const),
  );

  const resolve = (id: string | null): DocumentSnapshot | null => {
    if (id === null) return null;
    const snap = byId.get(id);
    if (!snap) throw new HttpError(400, "That character does not exist.");
    return snap;
  };

  const avatar = keepAvatar ? null : resolve(input.avatarId);
  const banner = keepBanner ? null : resolve(input.bannerId);

  await userRef.set(
    {
      ...(keepAvatar
        ? {}
        : {
            avatarId: avatar?.id ?? null,
            avatarName: avatar ? String(avatar.get("name") ?? avatar.id) : null,
            avatarUrl: imageOf(avatar),
            avatarKey: null,
          }),
      bannerTheme: input.bannerTheme,
      ...(keepBanner
        ? {}
        : { bannerId: banner?.id ?? null, bannerUrl: imageOf(banner), bannerKey: null }),
    },
    { merge: true },
  );

  await discard(keepAvatar ? null : oldAvatar);
  await discard(keepBanner ? null : oldBanner);
}

/** Stores an already processed picture as the user's avatar or banner and removes the one it replaces */
export async function saveUpload(
  uid: string,
  kind: Kind,
  image: Buffer,
): Promise<string> {
  const userRef = adminDb().collection(COL.users).doc(uid);
  const user = await userRef.get();
  if (typeof user.get("handle") !== "string")
    throw new HttpError(409, "Choose a handle first.");
  if (user.get("uploadsBlocked") === true)
    throw new HttpError(403, "Uploads are disabled for your account.");

  const previous = held(user, kind);
  const url = await putUserImage(uid, kind, image);

  await userRef.set(
    kind === "avatar"
      ? { avatarId: null, avatarName: null, avatarUrl: url, avatarKey: url }
      : { bannerId: null, bannerUrl: url, bannerKey: url },
    { merge: true },
  );

  if (previous && previous !== url) await discard(previous);
  return url;
}
