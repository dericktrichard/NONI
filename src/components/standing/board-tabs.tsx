"use client";

import Link from "next/link";
import { useState } from "react";
import { ProfileAvatar } from "@/components/profile/banner";
import type { BoardRow } from "@/lib/standing/types";
import { cn } from "@/lib/utils";

interface Boards {
  glaze: BoardRow[];
  week: BoardRow[];
  champions: BoardRow[];
  fans: BoardRow[];
}

const TABS: ReadonlyArray<{ key: keyof Boards; label: string; unit: string; hint: string }> = [
  { key: "glaze", label: "Glaze", unit: "Glaze", hint: "Highest balance right now." },
  { key: "week", label: "This week", unit: "net Glaze", hint: "Net Glaze won since Monday, UTC. Resets weekly, so anyone can climb." },
  { key: "champions", label: "Champions", unit: "titles", hint: "Tournament titles won." },
  { key: "fans", label: "Fans", unit: "points", hint: "The biggest fan of any one character." },
];

function Row({ row, unit }: { row: BoardRow; unit: string }) {
  const top = row.rank === 1;
  const note = row.note ? `${row.note}${row.tier ? ` · ${row.tier}` : ""}` : null;
  return (
    <li>
      <Link
        href={`/u/${row.handle}`}
        className={cn(
          "group grid grid-cols-[3rem_2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b px-2 py-3 transition-colors hover:bg-muted sm:px-3",
          top && "bg-muted",
        )}
      >
        <span className="tabular flex items-center gap-1.5 font-display text-xl font-semibold sm:text-2xl">
          {top ? <span className="size-2 bg-accent" aria-hidden /> : null}
          {row.rank}
        </span>
        <ProfileAvatar look={row.look} handle={row.handle} className="size-10 p-0.5" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium group-hover:underline sm:text-base">@{row.handle}</span>
          {note ? <span className="eyebrow block truncate">{note}</span> : null}
        </span>
        <span className="text-right">
          <span className="tabular block font-display text-lg font-semibold sm:text-xl">{row.value.toLocaleString("en-US")}</span>
          <span className="eyebrow block">{unit}</span>
        </span>
      </Link>
    </li>
  );
}

export function BoardTabs({ boards }: { boards: Boards }) {
  const [key, setKey] = useState<keyof Boards>("glaze");
  const tab = TABS.find((t) => t.key === key)!;
  const rows = boards[key];

  return (
    <div className="mt-8">
      <div role="group" aria-label="Leaderboard" className="flex overflow-x-auto border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={key === t.key}
            onClick={() => setKey(t.key)}
            className={cn(
              "h-11 shrink-0 border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted sm:px-5",
              key === t.key && "border-b-accent",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{tab.hint}</p>

      {rows.length === 0 ? (
        <div className="mt-4 border p-6">
          <p className="font-display text-lg font-semibold">Nobody is on this board yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Play a battle and switch on boards above to take the first place.</p>
        </div>
      ) : (
        <ol className="mt-2 border-t">
          {rows.map((row) => (
            <Row key={`${row.handle}-${row.slug ?? ""}`} row={row} unit={tab.unit} />
          ))}
        </ol>
      )}
    </div>
  );
}