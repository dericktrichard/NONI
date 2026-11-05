import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Portrait } from "@/components/characters/portrait";
import { TierBadge } from "@/components/characters/tier-badge";
import type { HeroSettings } from "@/lib/data/site-settings";
import type { SiteStats } from "@/lib/data/site-stats";
import { cn, formatScore } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";

interface HomeHeroProps {
  hero: HeroSettings | null;
  top: CharacterSummary | null;
  pair: [CharacterSummary, CharacterSummary] | null;
  stats: SiteStats;
}

const step = (index: number) => ({ "--i": index }) as React.CSSProperties;

function statItems(stats: SiteStats) {
  return [
    { label: "Characters", value: stats.characters },
    { label: "Verified feats", value: stats.verifiedFeats },
    { label: "Matchups", value: stats.matchups },
  ].filter((item): item is { label: string; value: number } => item.value !== null);
}

function Side({ c, flip }: { c: CharacterSummary; flip?: boolean }) {
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

const arrow =
  "size-6 shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1";

export function HomeHero({ hero, top, pair, stats }: HomeHeroProps) {
  const items = statItems(stats);
  const imageUrl = hero?.imageUrl ?? top?.imageUrl ?? null;
  const position = hero ? `${hero.focalX}% ${hero.focalY}%` : "50% 25%";

  return (
    <section className="relative isolate -mt-(--nav-space) overflow-hidden">
      <div
        aria-hidden
        className="hero-fade hero-dim pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(88svh,60rem)]"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: position }}
          />
        ) : null}
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-[calc(min(88svh,60rem)*0.66)] pb-10">
        {hero?.credit ? (
          <p className="eyebrow mb-2 text-right [text-shadow:0_1px_12px_var(--background)]">Art: {hero.credit}</p>
        ) : null}

        <div className="reveal acrylic divide-y" style={step(0)}>
          {pair ? (
            <Link href={`/matchups/${pair[0].id}/${pair[1].id}`} className="group block">
              <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
                <span className="eyebrow flex items-center gap-2">
                  <span className="size-2 bg-accent" aria-hidden />
                  Matchup of the day
                </span>
                <span className="eyebrow flex items-center gap-1 group-hover:underline">
                  See the verdict
                  <ArrowUpRight className="size-4" aria-hidden />
                </span>
              </div>
              <div className="grid sm:grid-cols-[1fr_auto_1fr]">
                <Side c={pair[0]} />
                <span
                  className="grid h-8 place-items-center bg-accent font-display text-sm font-semibold text-accent-foreground sm:h-auto sm:w-14 sm:text-xl"
                  aria-hidden
                >
                  VS
                </span>
                <Side c={pair[1]} flip />
              </div>
            </Link>
          ) : null}

          <div className="grid sm:grid-cols-[1fr_auto] sm:divide-x">
            <div className="flex flex-col justify-center gap-1 p-4 sm:p-5">
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Evidence decides.</h1>
              <p className="text-sm text-muted-foreground">
                Every ranking traces back to a cited feat. No proof, no points.
              </p>
            </div>
            <Link
              href="/matchups"
              className="group flex items-center justify-between gap-6 bg-accent p-4 text-accent-foreground transition-[filter] hover:brightness-95 sm:min-w-72 sm:p-5"
            >
              <span>
                <span className="block font-mono text-[0.6875rem] tracking-[0.08em] uppercase opacity-70">
                  Head to head
                </span>
                <span className="mt-1 block font-display text-2xl leading-tight font-semibold">Start a matchup</span>
              </span>
              <ArrowUpRight className={arrow} aria-hidden />
            </Link>
          </div>

          {items.length > 0 ? (
            <dl className="grid divide-x" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
              {items.map((item) => (
                <div key={item.label} className="p-3 sm:p-4">
                  <dt className="eyebrow">{item.label}</dt>
                  <dd className="tabular mt-1 font-display text-3xl font-semibold">
                    {item.value.toLocaleString("en-US")}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}