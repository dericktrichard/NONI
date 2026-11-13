import Link from "next/link";
import { cn, formatScore } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";
import { Portrait } from "./portrait";
import { RankMovement } from "./rank-movement";
import { TierBadge } from "./tier-badge";

export function Podium({ items }: { items: CharacterSummary[] }) {
  return (
    <ul className="bg-border grid gap-px border md:grid-cols-3">
      {items.slice(0, 3).map((c, i) => {
        const place = i + 1;
        const first = place === 1;

        return (
          <li key={c.id} className="bg-background">
            <Link
              href={`/characters/${c.id}`}
              className="group relative flex gap-3 p-3 sm:gap-4 sm:p-4"
            >
              {first ? (
                <span className="bg-accent absolute inset-x-0 top-0 h-1" aria-hidden />
              ) : null}

              <Portrait
                name={c.name}
                src={c.imageUrl}
                priority={first}
                sizes="96px"
                className="aspect-2/3 w-20 shrink-0 self-start sm:w-24"
              />

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 self-stretch">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "font-display text-4xl leading-none font-semibold tracking-tighter sm:text-5xl",
                      first
                        ? "bg-accent text-accent-foreground px-2 py-1"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {place}
                  </span>
                  <TierBadge tier={c.tier} />
                </div>

                <div className="min-w-0">
                  <p className="font-display truncate text-lg font-semibold underline-offset-4 group-hover:underline">
                    {c.name}
                  </p>
                  <p className="eyebrow truncate">{c.verse}</p>
                </div>

                <div className="flex items-end justify-between">
                  <span className="tabular text-xl font-semibold">
                    {formatScore(c.score)}
                  </span>
                  <RankMovement trend={c.trend} />
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
