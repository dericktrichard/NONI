import Link from "next/link";
import { formatScore, pad2 } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";
import { Portrait } from "./portrait";
import { RankMovement } from "./rank-movement";
import { TierBadge } from "./tier-badge";

export function RankingCard({ c, position }: { c: CharacterSummary; position: number }) {
  return (
    <li>
      <Link href={`/characters/${c.id}`} className="group block">
        <div className="relative">
          <Portrait
            name={c.name}
            src={c.imageUrl}
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
            className="aspect-4/5 w-full"
          />
          <span className="absolute top-0 left-0 bg-foreground px-2 py-1 font-display text-sm font-semibold tabular-nums text-background">
            {pad2(position)}
          </span>
          <span className="absolute top-2 right-2">
            <TierBadge tier={c.tier} />
          </span>
        </div>

        {/* Flat accent bar that wipes in on hover */}
        <span className="block h-1 w-0 bg-accent transition-[width] duration-200 group-hover:w-full" />

        <div className="border-b pt-3 pb-3">
          <p className="truncate font-display font-semibold group-hover:underline group-hover:underline-offset-4">
            {c.name}
          </p>
          <p className="eyebrow truncate">{c.verse}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="tabular font-semibold">{formatScore(c.score)}</span>
            <RankMovement trend={c.trend} />
          </div>
        </div>
      </Link>
    </li>
  );
}