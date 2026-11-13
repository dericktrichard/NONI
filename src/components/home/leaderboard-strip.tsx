import Link from "next/link";
import { SectionHeading } from "@/components/home/section-heading";
import { ProfileAvatar } from "@/components/profile/banner";
import type { FanGroup } from "@/lib/data/fan-groups";
import type { BoardRow } from "@/lib/standing/types";

type Entry = Pick<BoardRow, "rank" | "handle" | "look" | "value">;

function Column({ title, unit, rows }: { title: string; unit: string; rows: Entry[] }) {
  return (
    <div className="border">
      <p className="eyebrow truncate border-b px-3 py-2">{title}</p>
      {rows.length === 0 ? (
        <p className="text-muted-foreground p-3 text-sm">Nobody yet.</p>
      ) : (
        <ol>
          {rows.map((row) => (
            <li key={row.handle} className="border-b last:border-b-0">
              <Link
                href={`/u/${row.handle}`}
                className="hover:bg-muted grid grid-cols-[1.5rem_2rem_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2.5 transition-colors"
              >
                <span className="tabular font-display flex items-center gap-1 text-lg font-semibold">
                  {row.rank === 1 ? (
                    <span className="bg-accent size-2" aria-hidden />
                  ) : null}
                  {row.rank}
                </span>
                <ProfileAvatar
                  look={row.look}
                  handle={row.handle}
                  className="size-8 p-0.5"
                />
                <span className="min-w-0 truncate text-sm font-medium">
                  @{row.handle}
                </span>
                <span className="text-right">
                  <span className="tabular font-display text-base font-semibold">
                    {row.value.toLocaleString("en-US")}
                  </span>
                  <span className="eyebrow ml-1">{unit}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

interface LeaderboardStripProps {
  glaze: BoardRow[];
  champions: BoardRow[];
  fan: FanGroup | null;
}

export function LeaderboardStrip({ glaze, champions, fan }: LeaderboardStripProps) {
  const empty = glaze.length === 0 && champions.length === 0 && !fan;

  return (
    <section className="mt-10" aria-label="Leaderboard">
      <SectionHeading
        title="Who is on top"
        aside={
          <Link href="/leaderboard" className="hover:underline">
            Full leaderboard
          </Link>
        }
      />
      {empty ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border p-4">
          <p className="text-sm">
            Nobody is on the boards yet. Play a battle and switch on boards to take the
            first place.
          </p>
          <Link href="/battle" className="btn btn-solid btn-sm">
            Play a battle
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Column title="Highest Glaze" unit="Glaze" rows={glaze} />
          <Column title="Tournament titles" unit="titles" rows={champions} />
          {fan ? (
            <Column title={`Top fans: ${fan.name}`} unit="points" rows={fan.fans} />
          ) : (
            <Column title="Top fans" unit="points" rows={[]} />
          )}
        </div>
      )}
    </section>
  );
}
