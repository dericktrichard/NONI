import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpError } from "@/lib/data/feats";
import type { ListItem } from "@/lib/data/lists";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { nextListStatus, type ListStatus } from "@/lib/lists/moderation";
import type {
  ModerateListInput,
  ReportListInput,
} from "@/lib/validation/list-moderation";

export interface ReportedList {
  id: string;
  title: string;
  ownerHandle: string;
  status: ListStatus;
  items: ListItem[];
  reports: { reason: string; note: string }[];
}

export async function reportList(uid: string, input: ReportListInput): Promise<void> {
  const db = adminDb();
  const listRef = db.collection(COL.lists).doc(input.listId);
  const reportRef = db.collection(COL.listReports).doc(`${input.listId}_${uid}`);

  await db.runTransaction(async (tx) => {
    const [list, existing] = await Promise.all([tx.get(listRef), tx.get(reportRef)]);
    if (!list.exists || list.get("status") !== "visible")
      throw new HttpError(404, "List not found.");
    if (list.get("ownerUid") === uid)
      throw new HttpError(403, "You cannot report your own list.");
    if (existing.exists) throw new HttpError(409, "You already reported this list.");

    tx.create(reportRef, {
      listId: input.listId,
      reporterUid: uid,
      reason: input.reason,
      note: input.note,
      status: "open",
      createdAt: Timestamp.now(),
    });
    tx.update(listRef, { openReports: FieldValue.increment(1) });
  });
}

export async function moderateList(
  moderatorUid: string,
  input: ModerateListInput,
): Promise<{ handle: string }> {
  const db = adminDb();
  const listRef = db.collection(COL.lists).doc(input.listId);
  const openReports = db
    .collection(COL.listReports)
    .where("listId", "==", input.listId)
    .where("status", "==", "open")
    .limit(200);

  return db.runTransaction(async (tx) => {
    const list = await tx.get(listRef);
    if (!list.exists) throw new HttpError(404, "List not found.");

    const current: ListStatus = list.get("status") === "hidden" ? "hidden" : "visible";
    const next = nextListStatus(input.action, current);
    if (next === null)
      throw new HttpError(409, "That action does not apply to this list.");

    const ownerUid = String(list.get("ownerUid"));
    const owner = await tx.get(db.collection(COL.users).doc(ownerUid));
    const reports = input.action === "hide" ? null : await tx.get(openReports);
    const now = Timestamp.now();

    if (input.action === "hide") {
      tx.update(listRef, { status: next });
    } else {
      tx.update(listRef, { status: next, openReports: 0 });
      for (const report of reports?.docs ?? []) {
        tx.update(report.ref, {
          status: input.action === "restore" ? "restored" : "dismissed",
          closedBy: moderatorUid,
          closedAt: now,
        });
      }
    }

    tx.create(db.collection(COL.modLog).doc(), {
      moderatorUid,
      action: `list_${input.action}`,
      targetType: "list",
      targetId: input.listId,
      ownerUid,
      note: input.note,
      createdAt: now,
    });

    return { handle: String(owner.get("handle") ?? "") };
  });
}

export async function getReportedLists(): Promise<ReportedList[]> {
  const db = adminDb();
  const snap = await db
    .collection(COL.listReports)
    .where("status", "==", "open")
    .limit(100)
    .get();
  if (snap.empty) return [];

  const byList = new Map<string, { reason: string; note: string }[]>();
  for (const doc of snap.docs) {
    const listId = String(doc.get("listId"));
    const entry = {
      reason: String(doc.get("reason") ?? ""),
      note: String(doc.get("note") ?? ""),
    };
    const existing = byList.get(listId);
    if (existing) existing.push(entry);
    else byList.set(listId, [entry]);
  }

  const ids = [...byList.keys()].slice(0, 30);
  const lists = await db.getAll(...ids.map((id) => db.collection(COL.lists).doc(id)));

  const missing = new Set(ids.filter((_, index) => !lists[index]?.exists));
  if (missing.size > 0) {
    const batch = db.batch();
    for (const doc of snap.docs) {
      if (missing.has(String(doc.get("listId")))) batch.delete(doc.ref);
    }
    await batch.commit();
  }

  const present = lists.filter((list) => list.exists);
  const ownerIds = [...new Set(present.map((list) => String(list.get("ownerUid"))))];
  const owners = ownerIds.length
    ? await db.getAll(...ownerIds.map((id) => db.collection(COL.users).doc(id)))
    : [];
  const handles = new Map(
    owners.map((owner) => [owner.id, String(owner.get("handle") ?? "")]),
  );

  return present
    .map((list) => ({
      id: list.id,
      title: String(list.get("title") ?? ""),
      ownerHandle: handles.get(String(list.get("ownerUid"))) ?? "",
      status: (list.get("status") === "hidden" ? "hidden" : "visible") as ListStatus,
      items: ((list.get("items") as ListItem[] | undefined) ?? []).map((item) => ({
        characterId: String(item.characterId),
        name: String(item.name),
        reason: String(item.reason),
      })),
      reports: byList.get(list.id) ?? [],
    }))
    .sort((a, b) => b.reports.length - a.reports.length);
}
