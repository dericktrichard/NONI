import Link from "next/link";
import type { Standing } from "@/lib/standing/types";

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

export function GlazePanel({
  standing,
  isOwner,
}: {
  standing: Standing;
  isOwner: boolean;
}) {
  const cells = [
    {
      label: "Rank",
      value: standing.glaze.rank === null ? "--" : `#${standing.glaze.rank}`,
    },
    { label: "This week", value: signed(standing.week.value) },
    { label: "Titles", value: String(standing.champions.value) },
  ];

  return (
    <section aria-label="Glaze" className="mt-8 border">
      <div className="flex items-end justify-between gap-4 p-4 sm:p-5">
        <div>
          <p className="eyebrow">Glaze</p>
          <p className="tabular font-display mt-1 text-5xl leading-none font-semibold sm:text-6xl">
            {standing.glaze.value.toLocaleString("en-US")}
          </p>
        </div>
        {isOwner ? (
          <Link href="/battle" className="btn btn-solid btn-sm">
            Play to earn
          </Link>
        ) : null}
      </div>
      <dl className="bg-border grid grid-cols-3 gap-px border-t">
        {cells.map((cell) => (
          <div key={cell.label} className="bg-background p-3 sm:p-4">
            <dt className="eyebrow">{cell.label}</dt>
            <dd className="tabular font-display mt-1 text-lg font-semibold sm:text-xl">
              {cell.value}
            </dd>
          </div>
        ))}
      </dl>
      {isOwner && !standing.boards ? (
        <p className="text-muted-foreground border-t p-3 text-xs">
          Your rank shows once you switch on leaderboards below.
        </p>
      ) : null}
    </section>
  );
}
