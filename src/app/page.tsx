import Link from "next/link";
import { HomeHero } from "@/components/home/home-hero";
import { RailSection } from "@/components/home/rail";
import { RailCard, RailMore } from "@/components/home/rail-card";
import { fetchCharacters } from "@/lib/data/characters";
import { DEFAULT_PLAN } from "@/lib/data/query";
import { fetchHero } from "@/lib/data/site-settings";
import { fetchSiteStats } from "@/lib/data/site-stats";
import { buildRails } from "@/lib/home/rails";
import { currentDay, pickPair } from "@/lib/matchup/daily";

/**
 * One query of the top 60 feeds the hero pair and every rail. Cached ten minutes,
 * so the page costs at most about 9k reads a day however many people visit.
 */
export const revalidate = 600;

const POOL_SIZE = 60;

export default async function Home() {
  const [pool, stats, hero] = await Promise.all([
    fetchCharacters({ ...DEFAULT_PLAN, limit: POOL_SIZE, fetch: POOL_SIZE + 1 }),
    fetchSiteStats(),
    fetchHero(),
  ]);

  const items = pool.items;
  const pair = pickPair(items, currentDay());
  const rails = buildRails(items);

  return (
    <>
      <HomeHero hero={hero} top={items[0] ?? null} pair={pair} stats={stats} />

      <main className="mx-auto max-w-6xl px-4 pb-24">
        {rails.map((rail) => (
          <RailSection key={rail.id} eyebrow={rail.eyebrow} title={rail.title} href={rail.href}>
            {rail.items.map(({ c, position }) => (
              <RailCard key={c.id} c={c} position={position} />
            ))}
            <RailMore href={rail.href} label={rail.id === "top" ? "Full ranking" : `All ${rail.title}`} />
          </RailSection>
        ))}

        <section className="pt-14">
          <div className="flex flex-col gap-4 border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="eyebrow">Everything in one place</p>
              <p className="mt-1 font-display text-2xl font-semibold">Explore the full ranking</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Search every character and filter by medium and power tier.
              </p>
            </div>
            <Link href="/ranking" className="btn btn-solid shrink-0">
              Open the ranking
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}