import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";

const FAVOURITES = "favourites";
const MAX_FAVOURITES = 50;
const PROFILE_SHOWN = 12;

export interface FavouriteCard {
  id: string;
  name: string;
  verse: string;
  imageUrl: string | null;
}

export interface FavouriteState {
  favourited: boolean;
  fans: number;
}

const image = (value: unknown): string | null =>
  typeof value === "string" && value.startsWith("https://") ? value : null;

export async function readFavourite(
  uid: string,
  characterId: string,
): Promise<FavouriteState> {
  const db = adminDb();
  const [fav, character] = await Promise.all([
    db.collection(COL.users).doc(uid).collection(FAVOURITES).doc(characterId).get(),
    db.collection(COL.characters).doc(characterId).get(),
  ]);
  if (!character.exists) throw new HttpError(404, "Character not found.");
  return { favourited: fav.exists, fans: Number(character.get("fanCount")) || 0 };
}

export async function setFavourite(
  uid: string,
  characterId: string,
  on: boolean,
): Promise<FavouriteState> {
  const db = adminDb();
  const characterRef = db.collection(COL.characters).doc(characterId);
  const userRef = db.collection(COL.users).doc(uid);
  const favRef = userRef.collection(FAVOURITES).doc(characterId);

  return db.runTransaction(async (tx) => {
    const [character, user, fav] = await Promise.all([
      tx.get(characterRef),
      tx.get(userRef),
      tx.get(favRef),
    ]);
    if (!character.exists) throw new HttpError(404, "Character not found.");

    const fans = Number(character.get("fanCount")) || 0;
    const count = Number(user.get("favouriteCount")) || 0;
    if (on === fav.exists) return { favourited: on, fans };

    if (on) {
      if (count >= MAX_FAVOURITES) {
        throw new HttpError(409, `You can favourite up to ${MAX_FAVOURITES} characters.`);
      }
      tx.create(favRef, {
        characterId,
        name: String(character.get("name") ?? characterId),
        verse: String(character.get("verseName") ?? ""),
        imageUrl: image(character.get("imageUrl")),
        createdAt: Timestamp.now(),
      });
      tx.update(characterRef, { fanCount: fans + 1 });
      tx.set(userRef, { favouriteCount: count + 1 }, { merge: true });
      return { favourited: true, fans: fans + 1 };
    }

    tx.delete(favRef);
    tx.update(characterRef, { fanCount: Math.max(0, fans - 1) });
    tx.set(userRef, { favouriteCount: Math.max(0, count - 1) }, { merge: true });
    return { favourited: false, fans: Math.max(0, fans - 1) };
  });
}

export async function listFavourites(uid: string): Promise<FavouriteCard[]> {
  const snap = await adminDb()
    .collection(COL.users)
    .doc(uid)
    .collection(FAVOURITES)
    .orderBy("createdAt", "desc")
    .limit(PROFILE_SHOWN)
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    name: String(doc.get("name") ?? doc.id),
    verse: String(doc.get("verse") ?? ""),
    imageUrl: image(doc.get("imageUrl")),
  }));
}
