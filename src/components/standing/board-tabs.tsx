"use client";

import Link from "next/link";
import { useState } from "react";
import { ListCard } from "@/components/lists/list-card";
import { ProfileAvatar } from "@/components/profile/banner";
import type { PublicListEntry } from "@/lib/data/public-lists";
import type { BoardRow } from "@/lib/standing/types";
import { cn } from "@/lib/utils";

interface Boards {
  glaze: BoardRow[];
  week: BoardRow[];
  champions: BoardRow[];
  fans: BoardRow[];
}

type TabKey = keyof Boards | "lists";

const TABS: ReadonlyArray<{
  key: TabKey;
  label: string;
  unit: string;
  hint: string;
}> = [
  { key: "glaze", label: "Glaze", unit: "Glaze", hint: "Highest balance right now." },
  {
    key: "week",
    label: "This week",
    unit: "net Glaze",
    hint: "Net Glaze won since Monday, UTC. Resets weekly, so anyone can climb.",
  },
  {
    key: "champions",
    label: "Champions",
    unit: "titles",
    hint: "Tournament titles won.",
  },
  {
    key: "fans",
    label: "Fans",
    unit: "points",
    hint: "The biggest fan of any one character.",
  },
  {
    key: "lists",
    label: "Lists",
    unit: "",
    hint: "The newest public lists, from public profiles.",
  },
];

function Row({ row, unit }: { row: BoardRow; unit: string }) {
  const top = row.rank === 1;
  const note = row.note ? `${row.note}${row.tier ? ` · ${row.tier}` : ""}` : null;
  return (
    <li>
      <Link
        href={`/u/${row.handle}`}
        className={cn(
          "group hover:bg-muted grid grid-cols-[3rem_2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b px-2 py-3 transition-colors sm:px-3",
          top && "bg-muted",
        )}
      >
        <span className="tabular font-display flex items-center gap-1.5 text-xl font-semibold sm:text-2xl">
          {top ? <span className="bg-accent size-2" aria-hidden /> : null}
          {row.rank}
        </span>
        <ProfileAvatar look={row.look} handle={row.handle} className="size-10 p-0.5" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium group-hover:underline sm:text-base">
            @{row.handle}
          </span>
          {note ? <span className="eyebrow block truncate">{note}</span> : null}
        </span>
        <span className="text-right">
          <span className="tabular font-display block text-lg font-semibold sm:text-xl">
            {row.value.toLocaleString("en-US")}
          </span>
          <span className="eyebrow block">{unit}</span>
        </span>
      </Link>
    </li>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-4 border p-6">
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="text-muted-foreground mt-1 text-sm">{text}</p>
    </div>
  );
}

function ListsPanel({ lists }: { lists: PublicListEntry[] }) {
  if (lists.length === 0) {
    return (
      <Empty
        title="No public lists yet"
        text="Make one from your profile and it will show up here."
      />
    );
  }
  return (
    <ul className="mt-4 space-y-8">
      {lists.map(({ list, ownerHandle }) => (
        <li key={list.id}>
          <p className="eyebrow mb-2">
            by{" "}
            <Link href={`/u/${ownerHandle}`} className="hover:underline">
              @{ownerHandle}
            </Link>
          </p>
          <ListCard list={list} isOwner={false} />
        </li>
      ))}
    </ul>
  );
}

export function BoardTabs({
  boards,
  lists,
}: {
  boards: Boards;
  lists: PublicListEntry[];
}) {
  const [key, setKey] = useState<TabKey>("glaze");
  const tab = TABS.find((t) => t.key === key)!;
  const rows = key === "lists" ? [] : boards[key];

  return (
    <div className="mt-8">
      <div
        role="group"
        aria-label="Leaderboard"
        className="flex overflow-x-auto border-b"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={key === t.key}
            onClick={() => setKey(t.key)}
            className={cn(
              "hover:bg-muted h-11 shrink-0 border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap transition-colors sm:px-5",
              key === t.key && "border-b-accent",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-muted-foreground mt-3 text-xs">{tab.hint}</p>

      {key === "lists" ? (
        <ListsPanel lists={lists} />
      ) : rows.length === 0 ? (
        <Empty
          title="Nobody is on this board yet"
          text="Play a battle and switch on boards above to take the first place."
        />
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
