import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HomeHero } from "@/components/home/home-hero";
import { RailCard } from "@/components/home/rail-card";
import { RailSection } from "@/components/home/rail";
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
          <RailSection key={rail.id} eyebrow={rail.eyebrow} title={rail.title} href="/ranking">
            {rail.items.map(({ c, position }) => (
              <RailCard key={c.id} c={c} position={position} />
            ))}
          </RailSection>
        ))}

        <section className="pt-14">
          <Link
            href="/ranking"
            className="group flex items-center justify-between gap-6 border p-5 transition-colors hover:bg-muted"
          >
            <span>
              <span className="eyebrow block">Everything in one place</span>
              <span className="mt-1 block font-display text-2xl font-semibold">Explore the full ranking</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Search every character and filter by medium and power tier.
              </span>
            </span>
            <ArrowUpRight
              className="size-7 shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1"
              aria-hidden
            />
          </Link>
        </section>
      </main>
    </>
  );
}