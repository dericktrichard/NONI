import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PlayGame } from "@/components/play/play-game";
import { fetchCharacters } from "@/lib/data/characters";
import { DEFAULT_PLAN } from "@/lib/data/query";
import type { PlayCharacter } from "@/lib/play/game";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Play",
  description: "Higher or lower: guess which character scores more. A new daily puzzle every day.",
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
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:pt-12">
      <p className="eyebrow">Higher or lower</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl">Who scores more?</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        One character&apos;s score is showing. Guess whether the other is higher or lower. Scores come from the same
        evidence-based ranking as the rest of NONI.
      </p>
      <Link href="/battle" className="btn btn-line mt-6 inline-flex">
        Team battles, earn Glaze <ArrowRight className="size-4" aria-hidden />
      </Link>
      <PlayGame pool={pool} />
    </div>
  );
}