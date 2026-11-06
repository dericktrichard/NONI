import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import type { LookInput } from "@/lib/validation/look";

function imageOf(snap: DocumentSnapshot | null): string | null {
  const url = snap?.get("imageUrl");
  return typeof url === "string" && url.startsWith("https://") ? url : null;
}

export async function saveLook(uid: string, input: LookInput): Promise<void> {
  const db = adminDb();
  const wanted = [...new Set([input.avatarId, input.bannerId].filter((id): id is string => id !== null))];
  const snaps = wanted.length > 0 ? await db.getAll(...wanted.map((id) => db.collection(COL.characters).doc(id))) : [];
  const byId = new Map(snaps.filter((snap) => snap.exists).map((snap) => [snap.id, snap] as const));

  const resolve = (id: string | null): DocumentSnapshot | null => {
    if (id === null) return null;
    const snap = byId.get(id);
    if (!snap) throw new HttpError(400, "That character does not exist.");
    return snap;
  };

  const avatar = resolve(input.avatarId);
  const banner = resolve(input.bannerId);

  await db
    .collection(COL.users)
    .doc(uid)
    .set(
      {
        avatarId: avatar?.id ?? null,
        avatarName: avatar ? String(avatar.get("name") ?? avatar.id) : null,
        avatarUrl: imageOf(avatar),
        bannerTheme: input.bannerTheme,
        bannerId: banner?.id ?? null,
        bannerUrl: imageOf(banner),
      },
      { merge: true },
    );
}