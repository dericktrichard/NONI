import type { Metadata } from "next";
import { SectionTabs } from "@/components/layout/section-tabs";
import { PlayGame } from "@/components/play/play-game";
import { fetchCharacters } from "@/lib/data/characters";
import { DEFAULT_PLAN } from "@/lib/data/query";
import type { PlayCharacter } from "@/lib/play/game";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Play",
  description:
    "Higher or lower: guess which character scores more. A new daily puzzle every day.",
};

export default async function PlayPage() {
  const page = await fetchCharacters({ ...DEFAULT_PLAN, limit: 50, fetch: 51 });
  const pool: PlayCharacter[] = page.items.map((c) => ({
    id: c.id,
    name: c.name,
    verse: c.verse,
    tier: c.tier,
    score: c.score,
    imageUrl: c.imageUrl,
  }));

  return (
    <div data-stage-page className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:pt-12">
      <div data-chrome>
        <SectionTabs />
      </div>
      <p data-chrome className="eyebrow mt-8">
        Higher or lower
      </p>
      <PlayGame pool={pool} />
    </div>
  );
}
