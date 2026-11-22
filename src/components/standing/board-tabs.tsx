"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Portrait } from "@/components/characters/portrait";
import { ListItems } from "@/components/lists/list-card";
import { ListReportButton } from "@/components/lists/list-report-button";
import { ProfileAvatar } from "@/components/profile/banner";
import { MyStanding } from "@/components/standing/my-standing";
import { usePaged } from "@/hooks/use-paged";
import { useReveal } from "@/hooks/use-reveal";
import { useSession } from "@/hooks/use-session";
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

const ACTIVE_CHIP =
  "border-foreground bg-foreground text-background [box-shadow:inset_0_-2px_0_var(--color-accent)]";

function useMyHandle(): string | null {
  const { state } = useSession();
  return state.status === "ready" ? (state.user?.handle ?? null) : null;
}

/** The top three, big. On a wide screen the leader stands in the middle, taller. */
function Podium({
  rows,
  unit,
  me,
}: {
  rows: BoardRow[];
  unit: string;
  me: string | null;
}) {
  return (
    <ol className="mt-6 grid gap-3 sm:grid-cols-3 sm:items-end">
      {rows.map((row) => {
        const first = row.rank === 1;
        const mine = me !== null && row.handle === me;
        return (
          <li
            key={`${row.handle}-${row.slug ?? ""}`}
            className={cn(
              row.rank === 1 && "sm:order-2",
              row.rank === 2 && "sm:order-1",
              row.rank === 3 && "sm:order-3",
            )}
          >
            <Link
              href={`/u/${row.handle}`}
              className={cn(
                "group hover:border-foreground relative flex items-center gap-4 overflow-hidden border p-4 transition-colors sm:flex-col sm:gap-3 sm:text-center",
                first ? "sm:py-10" : "sm:py-6",
                mine && "border-foreground",
              )}
            >
              {first ? (
                <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-(--spark)" />
              ) : null}
              <span
                className={cn(
                  "tabular font-display text-4xl leading-none font-semibold sm:text-6xl",
                  first ? "text-(--spark-ink)" : "text-muted-foreground",
                )}
              >
                {row.rank}
              </span>
              <ProfileAvatar
                look={row.look}
                handle={row.handle}
                className={cn(
                  "size-14 shrink-0 p-0.5",
                  first ? "sm:size-24" : "sm:size-20",
                )}
              />
              <span className="min-w-0 flex-1 sm:flex-none">
                <span className="block truncate text-base font-medium group-hover:underline">
                  @{row.handle}
                </span>
                {mine ? <span className="eyebrow block">You</span> : null}
                <span className="tabular font-display mt-1 block text-2xl font-semibold sm:text-3xl">
                  {row.value.toLocaleString("en-US")}
                </span>
                <span className="eyebrow block">{unit}</span>
                {row.note ? (
                  <span className="text-muted-foreground block truncate text-xs">
                    {row.note}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function Row({
  row,
  unit,
  top,
  me,
}: {
  row: BoardRow;
  unit: string;
  top: number;
  me: string | null;
}) {
  const mine = me !== null && row.handle === me;
  const note = row.note ? `${row.note}${row.tier ? ` \u00b7 ${row.tier}` : ""}` : null;
  const share = top > 0 ? Math.max(3, Math.round((row.value / top) * 100)) : 0;
  return (
    <li>
      <Link
        href={`/u/${row.handle}`}
        className={cn(
          "group hover:bg-muted relative grid grid-cols-[2.5rem_2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b px-2 py-3 transition-colors sm:px-3",
          mine && "bg-muted",
        )}
      >
        <span className="tabular font-display text-muted-foreground text-lg font-semibold sm:text-xl">
          {row.rank}
        </span>
        <ProfileAvatar look={row.look} handle={row.handle} className="size-10 p-0.5" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium group-hover:underline sm:text-base">
            @{row.handle}
            {mine ? <span className="eyebrow ml-2">You</span> : null}
          </span>
          {note ? <span className="eyebrow block truncate">{note}</span> : null}
        </span>
        <span className="text-right">
          <span className="tabular font-display block text-lg font-semibold sm:text-xl">
            {row.value.toLocaleString("en-US")}
          </span>
          <span className="eyebrow block">{unit}</span>
        </span>
        <span
          aria-hidden
          className="bg-foreground/40 absolute bottom-0 left-0 h-px"
          style={{ width: `${share}%` }}
        />
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
  const me = useMyHandle();
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const reveal = useReveal(rest.length, 10);
  if (rows.length === 0) {
    return (
      <Empty
        title="Nobody is on this board yet"
        text="Play a battle and join the boards from your profile to take the first place."
      />
    );
  }
  const top = rows[0]?.value ?? 0;
  return (
    <>
      <Podium rows={podium} unit={unit} me={me} />
      {rest.length > 0 ? (
        <ol className="mt-6 border-t">
          {rest.slice(0, reveal.count).map((row) => (
            <Row
              key={`${row.handle}-${row.slug ?? ""}`}
              row={row}
              unit={unit}
              top={top}
              me={me}
            />
          ))}
        </ol>
      ) : null}
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
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div
          role="group"
          aria-label="Leaderboard"
          className="no-scrollbar -mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:flex-1"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={key === t.key}
              onClick={() => setKey(t.key)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center border px-3 text-sm font-medium whitespace-nowrap transition-colors",
                key === t.key ? ACTIVE_CHIP : "border-border hover:bg-foreground/10",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <MyStanding />
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
