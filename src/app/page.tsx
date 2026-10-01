import { RankingBoard } from "@/components/characters/ranking-board";
import { MOCK_CHARACTERS } from "@/config/mock-characters";

const ranked = [...MOCK_CHARACTERS].sort(
  (a, b) => b.score - a.score || a.name.localeCompare(b.name),
);

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:pt-12">
      <p className="eyebrow">Global ranking</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
        Evidence decides.
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Every ranking on NONI traces back to a cited feat. No proof, no points.
      </p>

      <div className="mt-8">
        <RankingBoard characters={ranked} />
      </div>
    </main>
  );
}