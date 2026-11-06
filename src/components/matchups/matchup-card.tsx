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
        className="group block border transition-colors hover:border-foreground"
      >
        <div className="grid grid-cols-[1fr_auto_1fr]">
          <Portrait name={m.a.name} src={m.a.imageUrl} sizes="160px" className="aspect-3/4 w-full" />
          <span
            className="grid w-8 place-items-center bg-foreground font-display text-xs font-semibold text-background"
            aria-hidden
          >
            VS
          </span>
          <Portrait name={m.b.name} src={m.b.imageUrl} sizes="160px" className="aspect-3/4 w-full" />
        </div>

        <div className="p-3">
          <p className="truncate font-display font-semibold underline-offset-4 group-hover:underline">
            {m.a.name} <span className="text-muted-foreground">vs</span> {m.b.name}
          </p>

          {total === 0 ? (
            <div className="mt-3 h-1.5 border bg-muted" aria-hidden />
          ) : (
            <div className="mt-3 flex h-1.5 border" aria-hidden>
              <div className="bg-foreground" style={{ width: `${percent}%` }} />
              <div className="flex-1 bg-accent" />
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