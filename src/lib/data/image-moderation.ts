import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import type { ImageKind } from "@/lib/profile/image-moderation";
import { deleteUserImage } from "@/lib/storage/r2";
import type {
  ModerateImageInput,
  ReportImageInput,
} from "@/lib/validation/image-moderation";

const REPORTS = "profileReports";

export interface ReportedImage {
  uid: string;
  handle: string;
  kind: ImageKind;
  imageUrl: string;
  blocked: boolean;
  reports: { reason: string; note: string }[];
}

export async function reportImage(
  reporterUid: string,
  input: ReportImageInput,
): Promise<void> {
  const db = adminDb();
  const userRef = db.collection(COL.users).doc(input.uid);
  const reportRef = db
    .collection(REPORTS)
    .doc(`${input.uid}_${input.kind}_${reporterUid}`);

  await db.runTransaction(async (tx) => {
    const [user, existing] = await Promise.all([tx.get(userRef), tx.get(reportRef)]);
    const imageUrl = user.get(`${input.kind}Key`);
    if (!user.exists || typeof imageUrl !== "string")
      throw new HttpError(404, "Image not found.");
    if (input.uid === reporterUid)
      throw new HttpError(403, "You cannot report your own image.");
    if (existing.exists && existing.get("imageUrl") === imageUrl) {
      throw new HttpError(409, "You already reported this image.");
    }

    tx.set(reportRef, {
      targetUid: input.uid,
      kind: input.kind,
      imageUrl,
      reporterUid,
      reason: input.reason,
      note: input.note,
      status: "open",
      createdAt: Timestamp.now(),
    });
  });
}

export async function moderateImage(
  moderatorUid: string,
  input: ModerateImageInput,
): Promise<{ handle: string }> {
  const db = adminDb();
  const userRef = db.collection(COL.users).doc(input.uid);
  const open = db
    .collection(REPORTS)
    .where("targetUid", "==", input.uid)
    .where("kind", "==", input.kind)
    .where("status", "==", "open")
    .limit(200);

  const { handle, removed } = await db.runTransaction(async (tx) => {
    const [user, reports] = await Promise.all([tx.get(userRef), tx.get(open)]);
    if (!user.exists) throw new HttpError(404, "User not found.");

    const held = user.get(`${input.kind}Key`);
    const url = typeof held === "string" ? held : null;
    if (input.action === "remove" && url === null)
      throw new HttpError(409, "That image is already gone.");

    const removing = input.action !== "dismiss";
    const now = Timestamp.now();

    if (removing) {
      tx.update(userRef, {
        ...(input.kind === "avatar"
          ? { avatarId: null, avatarName: null, avatarUrl: null, avatarKey: null }
          : { bannerId: null, bannerUrl: null, bannerKey: null }),
        ...(input.action === "block" ? { uploadsBlocked: true } : {}),
      });
    }

    for (const report of reports.docs) {
      tx.update(report.ref, {
        status: removing ? "actioned" : "dismissed",
        closedBy: moderatorUid,
        closedAt: now,
      });
    }

    tx.create(db.collection(COL.modLog).doc(), {
      moderatorUid,
      action: `image_${input.action}`,
      targetType: "profile_image",
      targetId: `${input.uid}/${input.kind}`,
      ownerUid: input.uid,
      note: input.note,
      createdAt: now,
    });

    return { handle: String(user.get("handle") ?? ""), removed: removing ? url : null };
  });

  if (removed) {
    try {
      await deleteUserImage(removed);
    } catch (error) {
      console.error("moderated image delete failed", error);
    }
  }
  return { handle };
}

export async function getReportedImages(): Promise<ReportedImage[]> {
  const db = adminDb();
  const snap = await db
    .collection(REPORTS)
    .where("status", "==", "open")
    .limit(200)
    .get();
  if (snap.empty) return [];

  const uids = [...new Set(snap.docs.map((doc) => String(doc.get("targetUid"))))].slice(
    0,
    30,
  );
  const users = new Map(
    (await db.getAll(...uids.map((id) => db.collection(COL.users).doc(id)))).map(
      (user) => [user.id, user] as const,
    ),
  );

  const stale = db.batch();
  let staleCount = 0;
  const groups = new Map<string, ReportedImage>();

  for (const doc of snap.docs) {
    const uid = String(doc.get("targetUid"));
    const user = users.get(uid);
    if (!user) continue;

    const kind: ImageKind = doc.get("kind") === "banner" ? "banner" : "avatar";
    const imageUrl = String(doc.get("imageUrl") ?? "");
    if (!user.exists || user.get(`${kind}Key`) !== imageUrl) {
      stale.update(doc.ref, { status: "stale" });
      staleCount += 1;
      continue;
    }

    const entry = {
      reason: String(doc.get("reason") ?? ""),
      note: String(doc.get("note") ?? ""),
    };
    const key = `${uid}/${kind}`;
    const group = groups.get(key);
    if (group) group.reports.push(entry);
    else {
      groups.set(key, {
        uid,
        handle: String(user.get("handle") ?? ""),
        kind,
        imageUrl,
        blocked: user.get("uploadsBlocked") === true,
        reports: [entry],
      });
    }
  }

  if (staleCount > 0) await stale.commit();
  return [...groups.values()].sort((a, b) => b.reports.length - a.reports.length);
}
