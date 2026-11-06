import type { Metadata } from "next";
import Link from "next/link";
import { Portrait } from "@/components/characters/portrait";
import { TierBadge } from "@/components/characters/tier-badge";
import { SectionHeading } from "@/components/home/section-heading";
import { NewMatchupButton, SurpriseButton } from "@/components/matchups/matchup-actions";
import { MatchupCard } from "@/components/matchups/matchup-card";
import { fetchCharacters } from "@/lib/data/characters";
import { DEFAULT_PLAN } from "@/lib/data/query";
import { fetchMatchupFeed } from "@/lib/data/matchup-feed";
import { currentDay, pickPair } from "@/lib/matchup/daily";
import { cn, formatScore } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Matchups",
  description: "Head to head matchups decided by verified feats, with community votes and arguments.",
};

function DailySide({ c, flip }: { c: CharacterSummary; flip?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3 p-3 sm:gap-4 sm:p-4", flip && "sm:flex-row-reverse sm:text-right")}>
      <Portrait name={c.name} src={c.imageUrl} sizes="96px" className="aspect-2/3 w-14 shrink-0 sm:w-20" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg font-semibold sm:text-xl">{c.name}</p>
        <p className="eyebrow truncate">{c.verse}</p>
        <div className={cn("mt-2 flex items-center gap-2", flip && "sm:justify-end")}>
          <TierBadge tier={c.tier} />
          <span className="tabular text-sm">{formatScore(c.score)}</span>
        </div>
      </div>
    </div>
  );
}

export default async function MatchupsPage() {
  const [pool, feed] = await Promise.all([
    fetchCharacters({ ...DEFAULT_PLAN, limit: 12, fetch: 13 }),
    fetchMatchupFeed(),
  ]);

  const pair = pickPair(pool.items, currentDay());
  const empty = feed.hot.length === 0 && feed.recent.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-24 sm:pt-12">
      <p className="eyebrow">Head to head</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl">Who wins?</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Every verdict comes from verified feats and fixed rules, with the reasons shown. Add your vote and your
        argument beside it.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <NewMatchupButton className="btn btn-solid">New matchup</NewMatchupButton>
        <SurpriseButton className="btn btn-line">Surprise me</SurpriseButton>
      </div>

      {pair ? (
        <Link
          href={`/matchups/${pair[0].id}/${pair[1].id}`}
          className="group mt-10 block border transition-colors hover:border-foreground"
        >
          <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
            <span className="eyebrow flex items-center gap-2">
              <span className="size-2 bg-accent" aria-hidden />
              Matchup of the day
            </span>
            <span className="eyebrow flex items-center gap-2 group-hover:underline">
              See the verdict
              <span aria-hidden className="h-px w-5 bg-current transition-[width] duration-200 group-hover:w-8" />
            </span>
          </div>
          <div className="grid sm:grid-cols-[1fr_auto_1fr]">
            <DailySide c={pair[0]} />
            <span
              className="grid h-8 place-items-center bg-foreground font-display text-sm font-semibold text-background sm:h-auto sm:w-14 sm:text-xl"
              aria-hidden
            >
              VS
            </span>
            <DailySide c={pair[1]} flip />
          </div>
        </Link>
      ) : null}

      {empty ? (
        <div className="mt-10 border p-6">
          <p className="font-display text-lg font-semibold">No community matchups yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A matchup appears here once someone votes or makes an argument. Start one and be the first.
          </p>
        </div>
      ) : null}

      {feed.hot.length > 0 ? (
        <section className="mt-12">
          <SectionHeading title="Hot right now" aside="Votes and arguments" />
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {feed.hot.map((m) => (
              <MatchupCard key={m.id} m={m} />
            ))}
          </ul>
        </section>
      ) : null}

      {feed.recent.length > 0 ? (
        <section className="mt-12">
          <SectionHeading title="Recently active" />
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {feed.recent.map((m) => (
              <MatchupCard key={m.id} m={m} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}