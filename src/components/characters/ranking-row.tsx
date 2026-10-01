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
        className="group flex items-center gap-3 border-b px-2 py-3 transition-colors hover:bg-muted sm:gap-4"
      >
        <span className="w-9 shrink-0 text-right font-display text-2xl leading-none font-semibold tabular-nums text-muted-foreground transition-colors group-hover:text-foreground sm:w-12 sm:text-3xl">
          {pad2(position)}
        </span>

        <Portrait
          name={c.name}
          src={c.imageUrl}
          sizes="64px"
          className="h-18 w-14 shrink-0 sm:h-20 sm:w-16"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base leading-tight font-semibold sm:text-lg">
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

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="tabular text-lg font-semibold">{formatScore(c.score)}</span>
          <div className="flex items-center gap-2">
            <RankMovement trend={c.trend} />
            <TierBadge tier={c.tier} />
          </div>
        </div>
      </Link>
    </li>
  );
}