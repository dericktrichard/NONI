import Link from "next/link";
import { Portrait } from "@/components/characters/portrait";
import type { MatchupCardData } from "@/lib/matchup/feed";
import { sharePercent } from "@/lib/matchup/vote";

export function MatchupCard({ m }: { m: MatchupCardData }) {
  const total = m.votesA + m.votesB;
  const percent = sharePercent(m.votesA, total);

  return (
    <li>
      <Link
        href={`/matchups/${m.a.slug}/${m.b.slug}`}
        className="group hover:border-foreground block border transition-colors"
      >
        <div className="grid grid-cols-[1fr_auto_1fr]">
          <Portrait
            name={m.a.name}
            src={m.a.imageUrl}
            sizes="160px"
            className="aspect-3/4 w-full"
          />
          <span
            className="bg-foreground font-display text-background grid w-8 place-items-center text-xs font-semibold"
            aria-hidden
          >
            VS
          </span>
          <Portrait
            name={m.b.name}
            src={m.b.imageUrl}
            sizes="160px"
            className="aspect-3/4 w-full"
          />
        </div>

        <div className="p-3">
          <p className="font-display truncate font-semibold underline-offset-4 group-hover:underline">
            {m.a.name} <span className="text-muted-foreground">vs</span> {m.b.name}
          </p>

          {total === 0 ? (
            <div className="bg-muted mt-3 h-1.5 border" aria-hidden />
          ) : (
            <div className="mt-3 flex h-1.5 border" aria-hidden>
              <div className="bg-foreground" style={{ width: `${percent}%` }} />
              <div className="bg-accent flex-1" />
            </div>
          )}

          <p className="eyebrow mt-2">
            {total} {total === 1 ? "vote" : "votes"} / {m.argumentCount}{" "}
            {m.argumentCount === 1 ? "argument" : "arguments"}
          </p>
        </div>
      </Link>
    </li>
  );
}
