import { RankingBoard } from "@/components/characters/ranking-board";
import { fetchCharacters } from "@/lib/data/characters";
import { DEFAULT_PLAN } from "@/lib/data/query";

/**
 * The first page is rendered on the server and cached for five minutes, so most
 * visitors are served a static page and cost no Firestore reads. Filters and
 * "load more" go through /api/characters, which is cached at the CDN.
 */
export const revalidate = 300;

export default async function Home() {
  const initial = await fetchCharacters(DEFAULT_PLAN);

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
        <RankingBoard initial={initial} />
      </div>
    </main>
  );
}
