import { Suspense } from "react";
import { Explore } from "@/components/characters/explore";
import { GuestStrip } from "@/components/home/guest-strip";
import { HomeHero } from "@/components/home/home-hero";
import { LeaderboardStrip } from "@/components/home/leaderboard-strip";
import { RailSection } from "@/components/home/rail";
import { RailCard, RailMore } from "@/components/home/rail-card";
import { fetchCharacters } from "@/lib/data/characters";
import { getFanPage } from "@/lib/data/fan-groups";
import { getBoard } from "@/lib/data/standing";
import { DEFAULT_PLAN, PAGE } from "@/lib/data/query";
import { fetchHero } from "@/lib/data/site-settings";
import { fetchSiteStats } from "@/lib/data/site-stats";
import type { CharacterPage } from "@/lib/data/summary";
import { buildRails } from "@/lib/home/rails";
import { currentDay, pickPair } from "@/lib/matchup/daily";

/**
 * One query of the top 60 feeds the hero pair, every rail and the first page of the full list.
 * Cached ten minutes, so the page costs at most about 9k reads a day however many people visit.
 */
export const revalidate = 600;

const POOL_SIZE = 60;

export default async function Home() {
  const [pool, stats, hero, glaze, champions, fans] = await Promise.all([
    fetchCharacters({ ...DEFAULT_PLAN, limit: POOL_SIZE, fetch: POOL_SIZE + 1 }),
    fetchSiteStats(),
    fetchHero(),
    getBoard("glaze", 3),
    getBoard("champions", 3),
    getFanPage(0, 1),
  ]);

  const items = pool.items;
  const pair = pickPair(items, currentDay());
  const rails = buildRails(items);

  const initial: CharacterPage = {
    items: items.slice(0, PAGE.default),
    next: items.length > PAGE.default || pool.next !== null ? PAGE.default : null,
  };

  const heroNode = (
    <HomeHero hero={hero} cycle={items.slice(0, 3)} pair={pair} stats={stats} />
  );

  const overviewNode = (
    <>
      <GuestStrip />
      <LeaderboardStrip glaze={glaze} champions={champions} fan={fans.items[0] ?? null} />
      {rails.map((rail) => (
        <RailSection
          key={rail.id}
          eyebrow={rail.eyebrow}
          title={rail.title}
          href={rail.href}
        >
          {rail.items.map(({ c, position }) => (
            <RailCard key={c.id} c={c} position={position} />
          ))}
          <RailMore
            href={rail.href}
            label={rail.id === "top" ? "Full ranking" : `All ${rail.title}`}
          />
        </RailSection>
      ))}
    </>
  );

  return (
    <Suspense
      fallback={
        <>
          {heroNode}
          <main className="mx-auto max-w-6xl px-4 pt-6 pb-24">{overviewNode}</main>
        </>
      }
    >
      <Explore hero={heroNode} overview={overviewNode} initial={initial} />
    </Suspense>
  );
}
