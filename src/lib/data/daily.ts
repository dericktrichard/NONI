import "server-only";
import { FieldValue, type DocumentSnapshot } from "firebase-admin/firestore";
import {
  EMPTY_DAILY,
  FAIR,
  isRepeat,
  mayStake,
  type Daily,
} from "@/lib/battle/fair-play";
import { HttpError } from "@/lib/data/feats";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { dayKey } from "@/lib/glaze/rules";

const dailyRef = (uid: string) =>
  adminDb().collection(COL.users).doc(uid).collection("daily").doc(dayKey(new Date()));

const count = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;
const counts = (value: unknown): Record<string, number> =>
  value && typeof value === "object"
    ? Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, number] => typeof entry[1] === "number",
        ),
      )
    : {};
const keys = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

function read(snap: DocumentSnapshot): Daily {
  if (!snap.exists) return EMPTY_DAILY;
  return {
    matches: count(snap.get("matches")),
    staked: count(snap.get("staked")),
    net: count(snap.get("net")),
    practice: count(snap.get("practice")),
    climbRuns: count(snap.get("climbRuns")),
    matchups: keys(snap.get("matchups")),
    climbs: keys(snap.get("climbs")),
    fan: counts(snap.get("fan")),
  };
}

export async function getDaily(uid: string): Promise<Daily> {
  return read(await dailyRef(uid).get());
}

/**
 * Registers a match or tournament run for today and decides whether it is a repeat.
 * A stake on a repeat, or past the daily number of stakes, is refused here.
 */
export async function reserve(
  uid: string,
  input: { kind: "clash" | "climb"; key: string; stake: number },
): Promise<{ before: Daily; repeat: boolean }> {
  const doc = dailyRef(uid);
  return adminDb().runTransaction(async (tx) => {
    const before = read(await tx.get(doc));
    const repeat = isRepeat(
      input.kind === "clash" ? before.matchups : before.climbs,
      input.key,
    );

    if (!mayStake({ stake: input.stake, stakedToday: before.staked, repeat }))
      throw new HttpError(
        409,
        repeat
          ? "A repeated matchup cannot be staked."
          : `Stakes are limited to your first ${FAIR.staked.perDay} new matches each day.`,
      );

    tx.set(
      doc,
      input.kind === "clash"
        ? {
            matches: FieldValue.increment(1),
            staked: FieldValue.increment(input.stake > 0 ? 1 : 0),
            matchups: FieldValue.arrayUnion(input.key),
          }
        : {
            climbRuns: FieldValue.increment(1),
            climbs: FieldValue.arrayUnion(input.key),
          },
      { merge: true },
    );
    return { before, repeat };
  });
}

export async function addResult(
  uid: string,
  patch: { net?: number; practice?: number; fan?: Record<string, number> },
): Promise<void> {
  const fan = Object.entries(patch.fan ?? {}).filter(([, points]) => points > 0);
  if (!patch.net && !patch.practice && fan.length === 0) return;
  await dailyRef(uid).set(
    {
      net: FieldValue.increment(patch.net ?? 0),
      practice: FieldValue.increment(patch.practice ?? 0),
      ...(fan.length > 0
        ? {
            fan: Object.fromEntries(
              fan.map(([slug, points]) => [slug, FieldValue.increment(points)]),
            ),
          }
        : {}),
    },
    { merge: true },
  );
}
