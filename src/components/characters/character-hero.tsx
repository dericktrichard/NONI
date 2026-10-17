import { Badge } from "@/components/ui/badge";
import { MEDIA_LABELS } from "@/config/media";
import { formatScore, pad2 } from "@/lib/utils";
import type { CharacterView } from "@/types/character-page";
import { EvidenceMeter } from "./evidence-meter";
import { Portrait } from "./portrait";
import { TierBadge } from "./tier-badge";

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-background p-4">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 font-display text-2xl leading-tight font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

export function CharacterHero({ c }: { c: CharacterView }) {
  return (
    <section className="grid gap-6 border-b pb-8 md:grid-cols-[18rem_1fr] md:gap-10">
      <div>
        <Portrait
          name={c.name}
          src={c.imageUrl}
          sizes="(min-width: 768px) 288px, 100vw"
          priority
          className="aspect-4/5 w-full max-w-xs md:max-w-none"
        />
        {c.imageCredit ? <p className="eyebrow mt-2">Image: {c.imageCredit}</p> : null}
      </div>

      <div className="flex min-w-0 flex-col">
        <p className="eyebrow">
          {c.verse} / {MEDIA_LABELS[c.media]}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-none font-semibold tracking-tight sm:text-6xl">{c.name}</h1>
        {c.aliases.length > 0 ? <p className="mt-3 text-sm text-muted-foreground">Also known as {c.aliases.join(", ")}</p> : null}

        <dl className="mt-8 grid grid-cols-2 gap-px border bg-border sm:grid-cols-4">
          <Stat label="Rank">{c.rank ? pad2(c.rank) : "--"}</Stat>
          <Stat label="Score">{formatScore(c.score)}</Stat>
          <Stat label="Tier">
            <TierBadge tier={c.tier} />
          </Stat>
          <Stat label="Speed">
            <span className="text-base">{c.speed}</span>
          </Stat>
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <EvidenceMeter value={c.evidence} />
          <span className="eyebrow">
            {c.verifiedFeatCount} of {c.featCount} feats verified
          </span>
        </div>

        {c.tags.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {c.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="outline">{tag}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}