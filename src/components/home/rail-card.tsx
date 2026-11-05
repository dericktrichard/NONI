import Link from "next/link";
import { Portrait } from "@/components/characters/portrait";
import { RankMovement } from "@/components/characters/rank-movement";
import { TierBadge } from "@/components/characters/tier-badge";
import { cn, formatScore, pad2 } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";

export function RailCard({ c, position }: { c: CharacterSummary; position: number }) {
  return (
    <li className="w-36 shrink-0 snap-start sm:w-40 lg:w-44">
      <Link href={`/characters/${c.id}`} className="group block">
        <div className="relative">
          <Portrait name={c.name} src={c.imageUrl} sizes="176px" className="aspect-2/3 w-full" />
          <span
            className={cn(
              "absolute top-0 left-0 px-2 py-1 font-display text-sm font-semibold tabular-nums",
              position === 1 ? "bg-accent text-accent-foreground" : "bg-foreground text-background",
            )}
          >
            {pad2(position)}
          </span>
          <span className="absolute top-2 right-2">
            <TierBadge tier={c.tier} />
          </span>
        </div>

        <span className="block h-0.5 w-0 bg-accent transition-[width] duration-200 group-hover:w-full" />

        <p className="mt-2 truncate font-display text-sm font-semibold underline-offset-4 group-hover:underline sm:text-base">
          {c.name}
        </p>
        <p className="eyebrow truncate">{c.verse}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="tabular text-sm font-semibold">{formatScore(c.score)}</span>
          <RankMovement trend={c.trend} />
        </div>
      </Link>
    </li>
  );
}