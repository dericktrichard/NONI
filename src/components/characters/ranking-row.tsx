import Link from "next/link";
import { MEDIA_LABELS } from "@/config/media";
import { formatScore, pad2 } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";
import { EvidenceMeter } from "./evidence-meter";
import { Portrait } from "./portrait";
import { RankMovement } from "./rank-movement";
import { TierBadge } from "./tier-badge";

export function RankingRow({ c, position }: { c: CharacterSummary; position: number }) {
  return (
    <li>
      <Link
        href={`/characters/${c.id}`}
        className="group hover:bg-muted relative flex items-center gap-3 border-b px-2 py-3 transition-colors sm:gap-5 sm:px-3"
      >
        <span
          className="bg-accent absolute inset-y-0 left-0 w-0.75 scale-y-0 transition-transform duration-200 group-hover:scale-y-100"
          aria-hidden
        />

        <span className="font-display text-muted-foreground group-hover:text-foreground w-9 shrink-0 text-right text-2xl leading-none font-semibold tabular-nums transition-colors sm:w-12 sm:text-3xl">
          {pad2(position)}
        </span>

        <Portrait
          name={c.name}
          src={c.imageUrl}
          sizes="64px"
          className="h-18 w-14 shrink-0 sm:h-20 sm:w-16"
        />

        <div className="min-w-0 flex-1">
          <p className="font-display truncate text-base leading-tight font-semibold sm:text-lg">
            {c.name}
          </p>
          <p className="eyebrow mt-0.5 truncate">
            {c.verse} / {MEDIA_LABELS[c.media]}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <EvidenceMeter value={c.evidence} />
            <span className="eyebrow">{c.featCount} feats</span>
          </div>
        </div>

        <div className="hidden w-40 shrink-0 md:block">
          <p className="eyebrow">Speed</p>
          <p className="mt-0.5 truncate text-sm">{c.speed}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="tabular text-lg font-semibold sm:text-xl">
            {formatScore(c.score)}
          </span>
          <div className="flex items-center gap-2">
            <RankMovement trend={c.trend} />
            <TierBadge tier={c.tier} />
          </div>
        </div>
      </Link>
    </li>
  );
}
