import Link from "next/link";
import { ProfileAvatar } from "@/components/profile/banner";
import type { BoardRow } from "@/lib/standing/types";

export function TopFans({ fans, name }: { fans: BoardRow[]; name: string }) {
  return (
    <section className="border p-4" aria-label={`Top fans of ${name}`}>
      <p className="eyebrow">Top fans</p>
      {fans.length === 0 ? (
        <>
          <p className="text-muted-foreground mt-3 text-sm">
            No fans on the board yet. Fight with {name} in a battle and you could be the
            first.
          </p>
          <Link href="/battle" className="btn btn-line btn-sm mt-3 inline-flex">
            Go to battle
          </Link>
        </>
      ) : (
        <ol className="mt-3 space-y-2.5">
          {fans.map((fan) => (
            <li key={fan.handle}>
              <Link href={`/u/${fan.handle}`} className="group flex items-center gap-3">
                <span className="tabular font-display flex w-8 items-center gap-1.5 text-base font-semibold">
                  {fan.rank === 1 ? (
                    <span className="bg-accent size-1.5" aria-hidden />
                  ) : null}
                  {fan.rank}
                </span>
                <ProfileAvatar
                  look={fan.look}
                  handle={fan.handle}
                  className="size-8 p-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium group-hover:underline">
                    @{fan.handle}
                  </span>
                  <span className="eyebrow block truncate">{fan.tier ?? "Fan"}</span>
                </span>
                <span className="tabular text-sm">{fan.value}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
