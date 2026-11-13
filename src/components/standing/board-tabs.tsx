"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Portrait } from "@/components/characters/portrait";
import { ListItems } from "@/components/lists/list-card";
import { ListReportButton } from "@/components/lists/list-report-button";
import { ProfileAvatar } from "@/components/profile/banner";
import { useReveal, type Reveal } from "@/hooks/use-reveal";
import type { FanGroup } from "@/lib/data/fan-groups";
import type { PublicListEntry } from "@/lib/data/public-lists";
import type { BoardRow } from "@/lib/standing/types";
import { cn } from "@/lib/utils";

interface Boards {
  glaze: BoardRow[];
  week: BoardRow[];
  champions: BoardRow[];
  fans: FanGroup[];
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
    hint: "The biggest fans of each character. Points come from playing battles with that character.",
  },
  {
    key: "lists",
    label: "Lists",
    unit: "",
    hint: "The newest public lists, from public profiles. Open one to see its characters.",
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

function More({ reveal }: { reveal: Reveal }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const { more, showMore, count } = reveal;

  useEffect(() => {
    if (!node || !more || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) showMore();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, more, showMore, count]);

  if (!more) return null;
  return (
    <div ref={setNode} className="mt-4 flex justify-center">
      <button type="button" className="btn btn-line btn-sm" onClick={showMore}>
        Show more
      </button>
    </div>
  );
}

function RowsPanel({ rows, unit }: { rows: BoardRow[]; unit: string }) {
  const reveal = useReveal(rows.length, 10);
  if (rows.length === 0) {
    return (
      <Empty
        title="Nobody is on this board yet"
        text="Play a battle and switch on boards above to take the first place."
      />
    );
  }
  return (
    <>
      <ol className="mt-2 border-t">
        {rows.slice(0, reveal.count).map((row) => (
          <Row key={`${row.handle}-${row.slug ?? ""}`} row={row} unit={unit} />
        ))}
      </ol>
      <More reveal={reveal} />
    </>
  );
}

function FansPanel({ groups }: { groups: FanGroup[] }) {
  const reveal = useReveal(groups.length);
  if (groups.length === 0) {
    return (
      <Empty
        title="No fans yet"
        text="Play a battle and switch on boards above to become a character's first fan."
      />
    );
  }
  return (
    <>
      <ul className="mt-4 space-y-4">
        {groups.slice(0, reveal.count).map((group) => (
          <li key={group.slug} className="border">
            <div className="bg-muted/50 flex items-center gap-3 border-b p-3">
              <Portrait
                name={group.name}
                src={group.imageUrl}
                sizes="48px"
                className="aspect-2/3 w-10 shrink-0 border"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/characters/${group.slug}`}
                  className="font-display block truncate text-lg font-semibold hover:underline"
                >
                  {group.name}
                </Link>
                <p className="eyebrow">
                  {group.fans.length === 1 ? "Biggest fan" : "Biggest fans"}
                </p>
              </div>
            </div>
            <ol>
              {group.fans.map((fan) => (
                <li key={fan.handle} className="border-b last:border-b-0">
                  <Link
                    href={`/u/${fan.handle}`}
                    className="hover:bg-muted grid grid-cols-[2rem_2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 transition-colors"
                  >
                    <span className="tabular font-display flex items-center gap-1.5 text-lg font-semibold">
                      {fan.rank === 1 ? (
                        <span className="bg-accent size-2" aria-hidden />
                      ) : null}
                      {fan.rank}
                    </span>
                    <ProfileAvatar
                      look={fan.look}
                      handle={fan.handle}
                      className="size-10 p-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        @{fan.handle}
                      </span>
                      {fan.tier ? (
                        <span className="eyebrow block">{fan.tier}</span>
                      ) : null}
                    </span>
                    <span className="text-right">
                      <span className="tabular font-display block text-lg font-semibold">
                        {fan.value}
                      </span>
                      <span className="eyebrow block">points</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
      <More reveal={reveal} />
    </>
  );
}

function ListEntry({ list, ownerHandle }: PublicListEntry) {
  const count = list.items.length;
  return (
    <details className="group border">
      <summary className="hover:bg-muted flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="font-display block truncate text-lg font-semibold">
            {list.title}
          </span>
          <span className="eyebrow block truncate">
            by @{ownerHandle} · {count} {count === 1 ? "character" : "characters"}
          </span>
        </span>
        <span className="hidden gap-1 sm:flex" aria-hidden>
          {list.items.slice(0, 4).map((item) => (
            <Portrait
              key={item.characterId}
              name={item.name}
              src={item.imageUrl}
              sizes="24px"
              className="aspect-2/3 w-6 border"
            />
          ))}
        </span>
        <ChevronDown
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t">
        <ListItems list={list} />
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-4 py-2">
        <Link href={`/u/${ownerHandle}`} className="eyebrow hover:underline">
          View profile
        </Link>
        <ListReportButton listId={list.id} />
      </div>
    </details>
  );
}

function ListsPanel({ lists }: { lists: PublicListEntry[] }) {
  const reveal = useReveal(lists.length);
  if (lists.length === 0) {
    return (
      <Empty
        title="No public lists yet"
        text="Make one from your profile and it will show up here."
      />
    );
  }
  return (
    <>
      <ul className="mt-4 space-y-3">
        {lists.slice(0, reveal.count).map((entry) => (
          <li key={entry.list.id}>
            <ListEntry {...entry} />
          </li>
        ))}
      </ul>
      <More reveal={reveal} />
    </>
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
      ) : key === "fans" ? (
        <FansPanel groups={boards.fans} />
      ) : (
        <RowsPanel key={key} rows={boards[key]} unit={tab.unit} />
      )}
    </div>
  );
}
