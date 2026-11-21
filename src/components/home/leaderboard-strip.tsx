import Link from "next/link";
import { Portrait } from "@/components/characters/portrait";
import { ProfileAvatar } from "@/components/profile/banner";
import type { BankRow } from "@/lib/data/banks";
import type { FanGroup } from "@/lib/data/fan-groups";
import type { BoardRow } from "@/lib/standing/types";

type Entry = Pick<BoardRow, "rank" | "handle" | "look" | "value">;

const ROW =
  "hover:bg-muted grid grid-cols-[1.5rem_2rem_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2.5 transition-colors";

function Rank({ rank }: { rank: number }) {
  return (
    <span
      className={`tabular font-display text-lg font-semibold ${rank === 1 ? "text-(--spark-ink)" : ""}`}
    >
      {rank}
    </span>
  );
}

function Value({ value, unit }: { value: number; unit: string }) {
  return (
    <span className="text-right">
      <span className="tabular font-display text-base font-semibold">
        {value.toLocaleString("en-US")}
      </span>
      <span className="eyebrow ml-1">{unit}</span>
    </span>
  );
}

function Column({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <div className="border">
      <Link
        href="/leaderboard"
        className="eyebrow hover:bg-muted block truncate border-b px-3 py-2 hover:underline"
      >
        {title}
      </Link>
      {empty ? (
        <p className="text-muted-foreground p-3 text-sm">Nobody yet.</p>
      ) : (
        <ol>{children}</ol>
      )}
    </div>
  );
}

function PeopleColumn({
  title,
  unit,
  rows,
}: {
  title: string;
  unit: string;
  rows: Entry[];
}) {
  return (
    <Column title={title} empty={rows.length === 0}>
      {rows.map((row) => (
        <li key={row.handle} className="border-b last:border-b-0">
          <Link href={`/u/${row.handle}`} className={ROW}>
            <Rank rank={row.rank} />
            <ProfileAvatar look={row.look} handle={row.handle} className="size-8 p-0.5" />
            <span className="min-w-0 truncate text-sm font-medium">@{row.handle}</span>
            <Value value={row.value} unit={unit} />
          </Link>
        </li>
      ))}
    </Column>
  );
}

function BankColumn({ rows }: { rows: BankRow[] }) {
  return (
    <Column title="Richest characters" empty={rows.length === 0}>
      {rows.map((row) => (
        <li key={row.slug} className="border-b last:border-b-0">
          <Link href={`/characters/${row.slug}`} className={ROW}>
            <Rank rank={row.rank} />
            <Portrait
              name={row.name}
              src={row.imageUrl}
              sizes="32px"
              className="aspect-2/3 w-6 border"
            />
            <span className="min-w-0 truncate text-sm font-medium">{row.name}</span>
            <Value value={row.value} unit="Glaze" />
          </Link>
        </li>
      ))}
    </Column>
  );
}

interface LeaderboardStripProps {
  glaze: BoardRow[];
  champions: BoardRow[];
  fan: FanGroup | null;
  banks: BankRow[];
}

export function LeaderboardStrip({
  glaze,
  champions,
  fan,
  banks,
}: LeaderboardStripProps) {
  const empty =
    glaze.length === 0 && champions.length === 0 && !fan && banks.length === 0;

  return (
    <section aria-label="Leaderboard">
      {empty ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border p-4">
          <p className="text-sm">
            Nobody is on the boards yet. Play a battle and switch on boards to take the
            first place.
          </p>
          <Link href="/battle" className="btn btn-solid btn-sm">
            Play a battle
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PeopleColumn title="Highest Glaze" unit="Glaze" rows={glaze} />
          <div className="hidden sm:block">
            <PeopleColumn title="Tournament titles" unit="titles" rows={champions} />
          </div>
          <div className="hidden sm:block">
            <PeopleColumn
              title={fan ? `Top fans: ${fan.name}` : "Top fans"}
              unit="points"
              rows={fan ? fan.fans : []}
            />
          </div>
          <BankColumn rows={banks} />
        </div>
      )}
    </section>
  );
}
