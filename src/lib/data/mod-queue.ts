import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import type { ReportReason } from "@/lib/moderation/actions";
import type { FeatClaim } from "@/lib/ranking/profile";
import type { FeatView } from "@/types/character-page";
import type { FeatStatus, Proof } from "@/types/domain";

const LIMIT = 25;
const REPORT_SCAN = 200;
const REPORTS_SHOWN = 5;

export interface QueueReport {
  reason: ReportReason;
  note: string;
}

export interface QueueFeat extends FeatView {
  characterId: string;
  openReports: number;
  staffLocked: boolean;
  reports: QueueReport[];
}

export interface ModQueue {
  reported: QueueFeat[];
  pending: QueueFeat[];
}

function toQueueFeat(doc: DocumentSnapshot, reports: QueueReport[] = []): QueueFeat {
  const created = doc.get("createdAt");
  return {
    id: doc.id,
    title: String(doc.get("title") ?? ""),
    description: String(doc.get("description") ?? ""),
    claim: doc.get("claim") as FeatClaim,
    proofs: (doc.get("proofs") ?? []) as Proof[],
    status: doc.get("status") as FeatStatus,
    upvotes: Number(doc.get("upvotes") ?? 0),
    downvotes: Number(doc.get("downvotes") ?? 0),
    authorName: String(doc.get("authorName") ?? ""),
    createdAt: created?.toDate ? created.toDate().toISOString() : "",
    characterId: String(doc.get("characterId") ?? ""),
    openReports: reports.length,
    staffLocked: doc.get("staffLocked") === true,
    reports,
  };
}

export async function fetchModQueue(): Promise<ModQueue> {
  const db = adminDb();

  const [openSnap, pendingSnap] = await Promise.all([
    db.collection(COL.reports).where("status", "==", "open").limit(REPORT_SCAN).get(),
    db
      .collectionGroup(COL.feats)
      .where("status", "==", "pending")
      .orderBy("netScore", "desc")
      .limit(LIMIT)
      .get(),
  ]);

  const grouped = new Map<string, { characterId: string; reports: QueueReport[] }>();
  for (const report of openSnap.docs) {
    const featId = String(report.get("featId"));
    const entry = grouped.get(featId) ?? { characterId: String(report.get("characterId")), reports: [] };
    entry.reports.push({
      reason: report.get("reason") as ReportReason,
      note: String(report.get("note") ?? ""),
    });
    grouped.set(featId, entry);
  }

  const top = [...grouped.entries()].sort((a, b) => b[1].reports.length - a[1].reports.length).slice(0, LIMIT);
  const refs = top.map(([featId, entry]) =>
    db.collection(COL.characters).doc(entry.characterId).collection(COL.feats).doc(featId),
  );
  const snaps = refs.length > 0 ? await db.getAll(...refs) : [];

  const reported: QueueFeat[] = [];
  snaps.forEach((snap, index) => {
    if (snap.exists) reported.push(toQueueFeat(snap, top[index][1].reports.slice(0, REPORTS_SHOWN)));
  });

  const reportedIds = new Set(reported.map((feat) => feat.id));
  const pending = pendingSnap.docs.filter((doc) => !reportedIds.has(doc.id)).map((doc) => toQueueFeat(doc));

  return { reported, pending };
}