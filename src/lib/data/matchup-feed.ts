import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/firebase/paths";
import { splitFeed, toCard, type MatchupCardData } from "@/lib/matchup/feed";

/** The only read: the 30 most recently active matchups. Cached by the page, so about 4k reads a day at most. */
const FEED_READ = 30;

export async function fetchMatchupFeed(): Promise<{
  hot: MatchupCardData[];
  recent: MatchupCardData[];
}> {
  try {
    const snapshot = await adminDb()
      .collection(COL.matchups)
      .orderBy("lastActivityAt", "desc")
      .limit(FEED_READ)
      .select(
        "characterAId",
        "characterBId",
        "aName",
        "bName",
        "aImageUrl",
        "bImageUrl",
        "votesA",
        "votesB",
        "argumentCount",
        "lastActivityAt",
      )
      .get();

    const cards = snapshot.docs
      .map((doc) => toCard(doc.id, doc.data()))
      .filter((card): card is MatchupCardData => card !== null);

    return splitFeed(cards);
  } catch (error) {
    console.error("matchup feed failed", error);
    return { hot: [], recent: [] };
  }
}
