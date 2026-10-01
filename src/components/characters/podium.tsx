import Link from "next/link";
import { cn, formatScore } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";
import { Portrait } from "./portrait";
import { TierBadge } from "./tier-badge";

export function Podium({ items }: { items: CharacterSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-px border bg-border md:grid-cols-3">
      {items.map((c, i) => {
        const place = i + 1;
        const featured = place === 1;

        return (
          <li key={c.id} className={cn("bg-background", featured && "col-span-2 md:col-span-1")}>
            <Link href={`/characters/${c.id}`} className="group relative block h-full p-3 sm:p-4">
              {featured && <span className="absolute inset-x-0 top-0 h-1 bg-accent" aria-hidden />}

              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "font-display text-6xl leading-none font-semibold tracking-tighter sm:text-7xl",
                    featured && "bg-accent px-2 text-accent-foreground",
                  )}
                >
                  {place}
                </span>
                <TierBadge tier={c.tier} />
              </div>

              <Portrait
                name={c.name}
                src={c.imageUrl}
                priority={featured}
                sizes="(min-width: 1152px) 380px, (min-width: 768px) 33vw, 50vw"
                className={cn(
                  "mt-3 w-full",
                  featured ? "aspect-16/10 md:aspect-4/5" : "aspect-4/5",
                )}
              />

              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold group-hover:underline group-hover:underline-offset-4">
                    {c.name}
                  </p>
                  <p className="eyebrow truncate">{c.verse}</p>
                </div>
                <span className="tabular text-xl font-semibold">{formatScore(c.score)}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}