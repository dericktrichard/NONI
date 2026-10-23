import "server-only";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import type { ReportReason } from "@/lib/moderation/actions";
import type { FeatClaim } from "@/lib/ranking/profile";
import { pseudonymFor } from "@/lib/security/pseudonym";
import type { FeatView } from "@/types/character-page";
import type { FeatStatus, Proof } from "@/types/domain";

const LIMIT = 25;
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

function toQueueFeat(doc: QueryDocumentSnapshot): QueueFeat {
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
    authorName: pseudonymFor(String(doc.get("authorUid") ?? "")),
    createdAt: created?.toDate ? created.toDate().toISOString() : "",
    characterId: String(doc.get("characterId") ?? ""),
    openReports: Number(doc.get("openReports") ?? 0),
    staffLocked: doc.get("staffLocked") === true,
    reports: [],
  };
}

export async function fetchModQueue(): Promise<ModQueue> {
  const db = adminDb();

  const [reportedSnap, pendingSnap] = await Promise.all([
    db.collection(COL.feats).where("openReports", ">", 0).orderBy("openReports", "desc").limit(LIMIT).get(),
    db.collection(COL.feats).where("status", "==", "pending").orderBy("netScore", "desc").limit(LIMIT).get(),
  ]);

  const reported = await Promise.all(
    reportedSnap.docs.map(async (doc) => {
      const feat = toQueueFeat(doc);
      const reports = await db
        .collection(COL.reports)
        .where("featId", "==", doc.id)
        .where("status", "==", "open")
        .limit(REPORTS_SHOWN)
        .get();
      feat.reports = reports.docs.map((report) => ({
        reason: report.get("reason") as ReportReason,
        note: String(report.get("note") ?? ""),
      }));
      return feat;
    }),
  );

  const reportedIds = new Set(reported.map((feat) => feat.id));
  const pending = pendingSnap.docs.filter((doc) => !reportedIds.has(doc.id)).map(toQueueFeat);

  return { reported, pending };
}