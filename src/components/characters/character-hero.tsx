import { NewMatchupButton } from "@/components/matchups/matchup-actions";
import { ShareButton } from "@/components/share/share-button";
import { Badge } from "@/components/ui/badge";
import { MEDIA_LABELS } from "@/config/media";
import { cn, formatScore, pad2 } from "@/lib/utils";
import type { CharacterView } from "@/types/character-page";
import { FavouriteButton } from "./favourite-button";
import { Portrait } from "./portrait";

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-background p-4">
      <dt className="eyebrow">{label}</dt>
      <dd className="font-display mt-1 text-2xl leading-tight font-semibold tabular-nums wrap-break-word">
        {children}
      </dd>
    </div>
  );
}

export function CharacterHero({ c }: { c: CharacterView }) {
  return (
    <section>
      <div className="grid grid-cols-[6.5rem_1fr] gap-4 sm:grid-cols-[11rem_1fr] sm:gap-8">
        <div>
          <Portrait
            name={c.name}
            src={c.imageUrl}
            sizes="176px"
            priority
            className="aspect-2/3 w-full"
          />
          {c.imageCredit ? (
            <p className="eyebrow mt-2 wrap-break-word">Image: {c.imageCredit}</p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col">
          <p className="eyebrow">
            {c.verse} / {MEDIA_LABELS[c.media]}
          </p>
          <h1 className="font-display mt-2 text-3xl leading-[0.95] font-semibold tracking-tight sm:text-6xl">
            {c.name}
          </h1>
          {c.aliases.length > 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">
              Also known as {c.aliases.join(", ")}
            </p>
          ) : null}
          {c.tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {c.tags.map((tag) => (
                <li key={tag}>
                  <Badge variant="outline">{tag}</Badge>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-5 flex flex-wrap items-start gap-2 sm:mt-auto sm:pt-5">
            <NewMatchupButton
              preset={{
                id: c.id,
                name: c.name,
                verse: c.verse,
                imageUrl: c.imageUrl,
                tier: c.tier,
              }}
              className="btn btn-solid btn-sm"
            >
              Compare
            </NewMatchupButton>
            <FavouriteButton characterId={c.id} />
            <ShareButton
              title={`${c.name} on NONI`}
              text={`${c.name} is ranked ${c.rank ? `#${c.rank}` : "unranked"} on NONI.`}
              className="btn btn-line btn-sm"
            />
          </div>
        </div>
      </div>

      <dl className="bg-border mt-6 grid grid-cols-2 gap-px border sm:grid-cols-4">
        <Stat label="Rank">
          <span className={cn(c.rank === 1 && "bg-accent text-accent-foreground px-2")}>
            {c.rank ? pad2(c.rank) : "--"}
          </span>
        </Stat>
        <Stat label="Score">{formatScore(c.score)}</Stat>
        <Stat label="Tier">{c.tier}</Stat>
        <Stat label="Speed">{c.speed}</Stat>
      </dl>
    </section>
  );
}
