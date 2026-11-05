import type { Metadata } from "next";
import { RankingBoard } from "@/components/characters/ranking-board";
import { SectionHeading } from "@/components/home/section-heading";
import { fetchCharacters } from "@/lib/data/characters";
import { DEFAULT_PLAN } from "@/lib/data/query";

export const metadata: Metadata = {
  title: "Ranking",
  description: "Every character on NONI, ranked by cited evidence.",
};

export const revalidate = 300;

export default async function RankingPage() {
  const initial = await fetchCharacters(DEFAULT_PLAN);

  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:pt-12">
      <SectionHeading index="01" title="The ranking" aside="Global ranking" />
      <div className="mt-6">
        <RankingBoard initial={initial} />
      </div>
    </main>
  );
}