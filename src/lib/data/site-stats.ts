import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";

export interface SiteStats {
  characters: number | null;
  verifiedFeats: number | null;
  matchups: number | null;
}

async function safeCount(label: string, run: () => Promise<number>): Promise<number | null> {
  try {
    return await run();
  } catch (error) {
    console.error(`site stat failed: ${label}`, error);
    return null;
  }
}

export async function fetchSiteStats(): Promise<SiteStats> {
  const db = adminDb();
  const [characters, verifiedFeats, matchups] = await Promise.all([
    safeCount("characters", async () => (await db.collection(COL.characters).count().get()).data().count),
    safeCount(
      "verifiedFeats",
      async () =>
        (await db.collectionGroup(COL.feats).where("status", "==", "verified").count().get()).data().count,
    ),
    safeCount("matchups", async () => (await db.collection(COL.matchups).count().get()).data().count),
  ]);
  return { characters, verifiedFeats, matchups };
}