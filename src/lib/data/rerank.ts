import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { COL } from "@/lib/firebase/paths";
import { rankField } from "@/lib/ranking/field";
import { compileProfile, type CombatProfile } from "@/lib/ranking/profile";
import { planRerank, type ExistingRank } from "@/lib/ranking/rerank-plan";
import type { PowerProfile } from "@/types/domain";

const BATCH_SIZE = 400;

export interface RerankResult {
  total: number;
  changed: number;
  skipped: string[];
}

export async function rerankAll(db: Firestore, options: { dryRun?: boolean } = {}): Promise<RerankResult> {
  const snapshot = await db.collection(COL.characters).get();
  const compiled: CombatProfile[] = [];
  const existing = new Map<string, ExistingRank>();
  const skipped: string[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const profile = data.profile as PowerProfile | undefined;
    try {
      if (!profile) throw new Error("missing profile");
      compiled.push(
        compileProfile({
          slug: doc.id,
          name: String(data.name ?? doc.id),
          attackPotency: profile.attackPotency,
          durability: profile.durability,
          speed: profile.speed,
          dimension: profile.dimension,
          hax: profile.hax,
          resistances: profile.resistances,
          verifiedFeatCount: Number(data.verifiedFeatCount) || 0,
        }),
      );
      existing.set(doc.id, {
        rank: typeof data.rank === "number" ? data.rank : null,
        score: Number(data.score) || 0,
        winRate: Number(data.winRate) || 0,
        wins: Number(data.wins) || 0,
        losses: Number(data.losses) || 0,
      });
    } catch {
      skipped.push(doc.id);
    }
  }

  const updates = planRerank(rankField(compiled), existing);

  if (!options.dryRun) {
    const now = Timestamp.now();
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = db.batch();
      for (const { slug, ...fields } of updates.slice(i, i + BATCH_SIZE)) {
        batch.update(db.collection(COL.characters).doc(slug), { ...fields, updatedAt: now });
      }
      await batch.commit();
    }
  }

  return { total: compiled.length, changed: updates.length, skipped };
}