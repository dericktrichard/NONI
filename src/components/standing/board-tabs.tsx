"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Portrait } from "@/components/characters/portrait";
import { ListItems } from "@/components/lists/list-card";
import { ListReportButton } from "@/components/lists/list-report-button";
import { ProfileAvatar } from "@/components/profile/banner";
import { usePaged } from "@/hooks/use-paged";
import { useReveal } from "@/hooks/use-reveal";
import type { BankRow } from "@/lib/data/banks";
import type { FanGroup } from "@/lib/data/fan-groups";
import type { PublicListEntry } from "@/lib/data/public-lists";
import type { Page } from "@/lib/paging/rules";
import type { BoardRow } from "@/lib/standing/types";
import { cn } from "@/lib/utils";

interface Boards {
  glaze: BoardRow[];
  week: BoardRow[];
  champions: BoardRow[];
  fans: Page<FanGroup, number>;
  banks: Page<BankRow, number>;
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
    key: "banks",
    label: "Richest characters",
    unit: "Glaze",
    hint: "Fans put Glaze into the banks of the characters they back. Banks never change a ranking.",
  },
  {
    key: "lists",
    label: "Lists",
    unit: "",
    hint: "The newest public lists, from public profiles. Open one to see its characters.",
  },
];

async function getPage<T, N>(url: string): Promise<Page<T, N> | null> {
  const response = await fetch(url);
  return response.ok ? ((await response.json()) as Page<T, N>) : null;
}

const loadLists = (cursor: string) =>
  getPage<PublicListEntry, string>(
    `/api/leaderboard/lists?cursor=${encodeURIComponent(cursor)}`,
  );
const loadFans = (offset: number) =>
  getPage<FanGroup, number>(`/api/leaderboard/fans?offset=${offset}`);
const loadBanksAll = (offset: number) =>
  getPage<BankRow, number>(`/api/leaderboard/banks?kind=all&offset=${offset}`);
const loadBanksWeek = (offset: number) =>
  getPage<BankRow, number>(`/api/leaderboard/banks?kind=week&offset=${offset}`);
const listKey = (entry: PublicListEntry) => entry.list.id;
const fanKey = (group: FanGroup) => group.slug;
const bankKey = (row: BankRow) => row.slug;
/** The week view has no server page, so it starts empty and loads its first page when shown */
const UNLOADED: Page<BankRow, number> = { items: [], next: 0 };

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

interface MoreProps {
  hasMore: boolean;
  busy: boolean;
  failed: boolean;
  onMore: () => void;
}

/** Loads the next page when it scrolls into view. The button is the fallback and the retry after a failure. */
function More({ hasMore, busy, failed, onMore }: MoreProps) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      !node ||
      !hasMore ||
      busy ||
      failed ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onMore();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, hasMore, busy, failed, onMore]);

  if (!hasMore) return null;
  return (
    <div ref={setNode} className="mt-4 flex flex-col items-center gap-2">
      {failed ? (
        <p className="text-muted-foreground text-xs">Could not load more.</p>
      ) : null}
      <button
        type="button"
        className="btn btn-line btn-sm"
        onClick={onMore}
        disabled={busy}
      >
        {busy ? "Loading..." : failed ? "Try again" : "Show more"}
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
      <More hasMore={reveal.more} busy={false} failed={false} onMore={reveal.showMore} />
    </>
  );
}

function FansPanel({ page }: { page: Page<FanGroup, number> }) {
  const paged = usePaged(page, loadFans, fanKey);
  if (paged.items.length === 0) {
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
        {paged.items.map((group) => (
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
      <More
        hasMore={paged.hasMore}
        busy={paged.busy}
        failed={paged.failed}
        onMore={paged.more}
      />
    </>
  );
}

function BankItem({ row }: { row: BankRow }) {
  return (
    <li className="border-b last:border-b-0">
      <Link
        href={`/characters/${row.slug}`}
        className="hover:bg-muted grid grid-cols-[2rem_2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 transition-colors"
      >
        <span className="tabular font-display flex items-center gap-1.5 text-lg font-semibold">
          {row.rank === 1 ? <span className="bg-accent size-2" aria-hidden /> : null}
          {row.rank}
        </span>
        <Portrait
          name={row.name}
          src={row.imageUrl}
          sizes="40px"
          className="aspect-2/3 w-8 border"
        />
        <span className="min-w-0 truncate text-sm font-medium">{row.name}</span>
        <span className="text-right">
          <span className="tabular font-display block text-lg font-semibold">
            {row.value.toLocaleString("en-US")}
          </span>
          <span className="eyebrow block">Glaze</span>
        </span>
      </Link>
    </li>
  );
}

function BankList({
  kind,
  initial,
}: {
  kind: "all" | "week";
  initial: Page<BankRow, number>;
}) {
  const paged = usePaged(
    initial,
    kind === "week" ? loadBanksWeek : loadBanksAll,
    bankKey,
  );
  if (paged.items.length === 0 && !paged.hasMore) {
    return (
      <Empty
        title="No banks yet"
        text="Put Glaze into a character's bank from its page to start one."
      />
    );
  }
  return (
    <>
      {paged.items.length > 0 ? (
        <ol className="mt-4 border">
          {paged.items.map((row) => (
            <BankItem key={row.slug} row={row} />
          ))}
        </ol>
      ) : null}
      <More
        hasMore={paged.hasMore}
        busy={paged.busy}
        failed={paged.failed}
        onMore={paged.more}
      />
    </>
  );
}

function BanksPanel({ initial }: { initial: Page<BankRow, number> }) {
  const [kind, setKind] = useState<"all" | "week">("all");
  return (
    <>
      <div role="group" aria-label="Period" className="mt-4 flex border-b">
        {(["all", "week"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={kind === value}
            onClick={() => setKind(value)}
            className={cn(
              "hover:bg-muted h-9 border-b-2 border-transparent px-3 text-xs font-medium transition-colors",
              kind === value && "border-b-accent",
            )}
          >
            {value === "all" ? "All time" : "This week"}
          </button>
        ))}
      </div>
      <BankList key={kind} kind={kind} initial={kind === "all" ? initial : UNLOADED} />
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

function ListsPanel({ page }: { page: Page<PublicListEntry, string> }) {
  const paged = usePaged(page, loadLists, listKey);
  if (paged.items.length === 0) {
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
        {paged.items.map((entry) => (
          <li key={entry.list.id}>
            <ListEntry {...entry} />
          </li>
        ))}
      </ul>
      <More
        hasMore={paged.hasMore}
        busy={paged.busy}
        failed={paged.failed}
        onMore={paged.more}
      />
    </>
  );
}

export function BoardTabs({
  boards,
  lists,
}: {
  boards: Boards;
  lists: Page<PublicListEntry, string>;
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
        <ListsPanel page={lists} />
      ) : key === "fans" ? (
        <FansPanel page={boards.fans} />
      ) : key === "banks" ? (
        <BanksPanel initial={boards.banks} />
      ) : (
        <RowsPanel key={key} rows={boards[key]} unit={tab.unit} />
      )}
    </div>
  );
}
