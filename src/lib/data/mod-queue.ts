import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import type { ReportReason } from "@/lib/moderation/actions";
import type { ArgumentStatus } from "@/lib/moderation/argument-actions";
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

export interface QueueArgument {
  a: string;
  b: string;
  argumentId: string;
  sideSlug: string;
  body: string;
  citations: Array<{ characterId: string; featId: string; title: string }>;
  authorName: string;
  status: ArgumentStatus;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  reports: QueueReport[];
}

export interface ModQueue {
  reported: QueueFeat[];
  pending: QueueFeat[];
  reportedArguments: QueueArgument[];
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

function toQueueArgument(doc: DocumentSnapshot, a: string, b: string, reports: QueueReport[]): QueueArgument {
  const created = doc.get("createdAt");
  const citations: unknown = doc.get("citations");
  return {
    a,
    b,
    argumentId: doc.id,
    sideSlug: doc.get("side") === "b" ? b : a,
    body: String(doc.get("body") ?? ""),
    citations: Array.isArray(citations)
      ? citations.map((item) => ({
          characterId: String(item?.characterId ?? ""),
          featId: String(item?.featId ?? ""),
          title: String(item?.title ?? ""),
        }))
      : [],
    authorName: String(doc.get("authorName") ?? ""),
    status: doc.get("status") === "hidden" ? "hidden" : "visible",
    upvotes: Number(doc.get("upvotes") ?? 0),
    downvotes: Number(doc.get("downvotes") ?? 0),
    createdAt: created?.toDate ? created.toDate().toISOString() : "",
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

  const featGroups = new Map<string, { characterId: string; reports: QueueReport[] }>();
  const argumentGroups = new Map<string, { matchupId: string; a: string; b: string; argumentId: string; reports: QueueReport[] }>();

  for (const report of openSnap.docs) {
    const item: QueueReport = {
      reason: report.get("reason") as ReportReason,
      note: String(report.get("note") ?? ""),
    };

    if (report.get("targetType") === "argument") {
      const matchupId = String(report.get("matchupId"));
      const argumentId = String(report.get("argumentId"));
      const key = `${matchupId}/${argumentId}`;
      const entry = argumentGroups.get(key) ?? {
        matchupId,
        a: String(report.get("a")),
        b: String(report.get("b")),
        argumentId,
        reports: [],
      };
      entry.reports.push(item);
      argumentGroups.set(key, entry);
      continue;
    }

    const featId = String(report.get("featId"));
    const entry = featGroups.get(featId) ?? { characterId: String(report.get("characterId")), reports: [] };
    entry.reports.push(item);
    featGroups.set(featId, entry);
  }

  const topFeats = [...featGroups.entries()].sort((x, y) => y[1].reports.length - x[1].reports.length).slice(0, LIMIT);
  const featRefs = topFeats.map(([featId, entry]) =>
    db.collection(COL.characters).doc(entry.characterId).collection(COL.feats).doc(featId),
  );
  const featSnaps = featRefs.length > 0 ? await db.getAll(...featRefs) : [];

  const reported: QueueFeat[] = [];
  featSnaps.forEach((snap, index) => {
    if (snap.exists) reported.push(toQueueFeat(snap, topFeats[index][1].reports.slice(0, REPORTS_SHOWN)));
  });

  const topArguments = [...argumentGroups.values()]
    .sort((x, y) => y.reports.length - x.reports.length)
    .slice(0, LIMIT);
  const argumentRefs = topArguments.map((entry) =>
    db.collection(COL.matchups).doc(entry.matchupId).collection(COL.arguments).doc(entry.argumentId),
  );
  const argumentSnaps = argumentRefs.length > 0 ? await db.getAll(...argumentRefs) : [];

  const reportedArguments: QueueArgument[] = [];
  argumentSnaps.forEach((snap, index) => {
    const entry = topArguments[index];
    if (snap.exists) {
      reportedArguments.push(toQueueArgument(snap, entry.a, entry.b, entry.reports.slice(0, REPORTS_SHOWN)));
    }
  });

  const reportedIds = new Set(reported.map((feat) => feat.id));
  const pending = pendingSnap.docs.filter((doc) => !reportedIds.has(doc.id)).map((doc) => toQueueFeat(doc));

  return { reported, pending, reportedArguments };
}