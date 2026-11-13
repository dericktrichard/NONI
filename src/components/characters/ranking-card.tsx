import Link from "next/link";
import { formatScore, pad2 } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";
import { Portrait } from "./portrait";
import { RankMovement } from "./rank-movement";
import { TierBadge } from "./tier-badge";

export function RankingCard({ c, position }: { c: CharacterSummary; position: number }) {
  return (
    <li>
      <Link
        href={`/characters/${c.id}`}
        className="group bg-background hover:border-foreground block border transition-colors"
      >
        <div className="relative">
          <Portrait
            name={c.name}
            src={c.imageUrl}
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
            className="aspect-4/5 w-full"
          />
          <span className="bg-foreground font-display text-background absolute top-0 left-0 px-2 py-1 text-sm font-semibold tabular-nums">
            {pad2(position)}
          </span>
          <span className="absolute top-2 right-2">
            <TierBadge tier={c.tier} />
          </span>
        </div>

        <span className="bg-accent block h-1 w-0 transition-[width] duration-200 group-hover:w-full" />

        <div className="p-3">
          <p className="font-display truncate font-semibold underline-offset-4 group-hover:underline">
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
