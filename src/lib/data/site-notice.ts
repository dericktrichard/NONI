import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import type { NoticeInput } from "@/lib/validation/notice";

const DOC = "notice";

export interface SiteNotice {
  enabled: boolean;
  title: string;
  body: string;
}

const WELCOME: SiteNotice = {
  enabled: false,
  title: "Welcome to NONI",
  body: "NONI ranks fictional characters from cited feats that the community verifies. The ranking you see today is only a starting point: every character was placed by an editor estimate, and most have not been confirmed yet. It will only become accurate with your help. Submit feats with proof, vote and argue on matchups, and report anything that looks wrong. Every contribution moves the numbers. Thank you for helping us get this right.",
};

async function read(): Promise<SiteNotice | null> {
  try {
    const snapshot = await adminDb().collection(COL.settings).doc(DOC).get();
    if (!snapshot.exists) return null;
    return {
      enabled: snapshot.get("enabled") === true,
      title: String(snapshot.get("title") ?? ""),
      body: String(snapshot.get("body") ?? ""),
    };
  } catch (error) {
    console.error("notice read failed", error);
    return null;
  }
}

/** What the home page shows: nothing at all unless a notice is switched on and filled in */
export async function fetchNotice(): Promise<SiteNotice | null> {
  const notice = await read();
  return notice && notice.enabled && notice.title && notice.body ? notice : null;
}

export async function getNoticeForEdit(): Promise<SiteNotice> {
  return (await read()) ?? WELCOME;
}

export async function saveNotice(actorUid: string, input: NoticeInput): Promise<void> {
  const db = adminDb();
  await db
    .collection(COL.settings)
    .doc(DOC)
    .set({ ...input, updatedAt: Timestamp.now(), updatedBy: actorUid });
  await db.collection(COL.modLog).doc().create({
    targetType: "settings",
    action: "notice",
    actorUid,
    enabled: input.enabled,
    title: input.title,
    at: FieldValue.serverTimestamp(),
  });
}
