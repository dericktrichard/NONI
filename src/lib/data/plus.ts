import "server-only";
import { FieldValue, type DocumentSnapshot } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { GLAZE, splitSpend } from "@/lib/glaze/rules";
import { PLUS, extendUntil, isActive } from "@/lib/plus/rules";
import { readLook, type Look } from "@/lib/profile/look";

const LEDGER = "ledger";

export interface PlusState {
  plus: boolean;
  /** When Plus ends, null when it is not active */
  until: number | null;
  /** The home banner, only while Plus is active */
  banner: { until: number; url: string | null; position: string } | null;
  /** Earned plus bought */
  balance: number;
}

const amountOf = (value: unknown, fallback: number): number =>
  typeof value === "number" ? value : fallback;

function view(
  input: { plusUntil: unknown; bannerUntil: unknown; look: Look; balance: number },
  now: number,
): PlusState {
  const until = isActive(input.plusUntil, now) ? input.plusUntil : null;
  const bannerUntil =
    until !== null && isActive(input.bannerUntil, now) ? input.bannerUntil : null;
  return {
    plus: until !== null,
    until,
    banner:
      bannerUntil !== null
        ? {
            until: bannerUntil,
            url: input.look.bannerUrl,
            position: input.look.bannerId ? "50% 15%" : "50% 50%",
          }
        : null,
    balance: input.balance,
  };
}

function readState(user: DocumentSnapshot, now: number): PlusState {
  return view(
    {
      plusUntil: user.get("plusUntil"),
      bannerUntil: user.get("homeBannerUntil"),
      look: readLook(user.data() ?? {}),
      balance: amountOf(user.get("glaze"), GLAZE.start) + amountOf(user.get("bought"), 0),
    },
    now,
  );
}

export async function getPlus(uid: string): Promise<PlusState> {
  return readState(await adminDb().collection(COL.users).doc(uid).get(), Date.now());
}

/**
 * Pays for 30 days of the personal home banner. Needs active Plus and a profile banner image.
 * Bought Glaze is spent first. The ledger entry is named after `nonce`, so a retry charges once.
 */
export async function buyHomeBanner(uid: string, nonce: string): Promise<PlusState> {
  const db = adminDb();
  const userRef = db.collection(COL.users).doc(uid);
  const entryRef = userRef.collection(LEDGER).doc(`banner-${nonce}`);

  return db.runTransaction(async (tx) => {
    const [user, entry] = await Promise.all([tx.get(userRef), tx.get(entryRef)]);
    const now = Date.now();
    if (entry.exists) return readState(user, now);

    if (!isActive(user.get("plusUntil"), now))
      throw new HttpError(403, "NONI Plus is needed for the home banner.");
    const look = readLook(user.data() ?? {});
    if (!look.bannerUrl) throw new HttpError(409, "Set a profile banner image first.");

    const earned = amountOf(user.get("glaze"), GLAZE.start);
    const bought = amountOf(user.get("bought"), 0);
    const price = PLUS.homeBanner.price;
    const split = splitSpend(earned, bought, price);
    if (!split) throw new HttpError(409, "Not enough Glaze.");

    const nextEarned = earned - split.earned;
    const nextBought = bought - split.bought;
    const until = extendUntil(user.get("homeBannerUntil"), now, PLUS.homeBanner.days);

    tx.set(
      userRef,
      {
        glaze: nextEarned,
        bought: nextBought,
        homeBannerUntil: until,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.set(entryRef, {
      amount: -price,
      wanted: -price,
      stake: 0,
      reason: "home banner",
      balanceAfter: nextEarned + nextBought,
      createdAt: FieldValue.serverTimestamp(),
    });

    return view(
      {
        plusUntil: user.get("plusUntil"),
        bannerUntil: until,
        look,
        balance: nextEarned + nextBought,
      },
      now,
    );
  });
}

/** Whether Plus is active right now. One read, taken when a battle starts. */
export async function hasPlus(uid: string): Promise<boolean> {
  return isActive(
    (await adminDb().collection(COL.users).doc(uid).get()).get("plusUntil"),
    Date.now(),
  );
}
