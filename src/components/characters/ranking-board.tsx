"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { MEDIA_LABELS } from "@/config/media";
import { cn } from "@/lib/utils";
import type { CharacterSummary, MediaType } from "@/types/character";
import { Podium } from "./podium";
import { RankingCard } from "./ranking-card";
import { RankingRow } from "./ranking-row";

type View = "rows" | "grid";
type Filter = "all" | MediaType;

export function RankingBoard({ characters }: { characters: CharacterSummary[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("rows");

  const chips = useMemo(() => {
    const counts = new Map<MediaType, number>();
    for (const c of characters) counts.set(c.media, (counts.get(c.media) ?? 0) + 1);
    return [
      { key: "all" as Filter, label: "All", count: characters.length },
      ...Array.from(counts, ([media, count]) => ({
        key: media as Filter,
        label: MEDIA_LABELS[media],
        count,
      })),
    ];
  }, [characters]);

  const visible = useMemo(
    () => (filter === "all" ? characters : characters.filter((c) => c.media === filter)),
    [characters, filter],
  );

  const showPodium = visible.length >= 3;
  const top = showPodium ? visible.slice(0, 3) : [];
  const rest = showPodium ? visible.slice(3) : visible;
  const offset = top.length;

  return (
    <section aria-label="Character ranking">
      {/* Sticky filter bar */}
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 -mx-4 flex items-center gap-3 border-b bg-background px-4 py-2">
        <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {chips.map((chip) => {
            const active = filter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(chip.key)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-sm border px-3 text-sm font-medium transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "bg-transparent hover:bg-muted",
                )}
              >
                {chip.label}
                <span className="tabular text-[0.6875rem] opacity-60">{chip.count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 border" role="group" aria-label="View">
          {(
            [
              ["rows", List, "List view"],
              ["grid", LayoutGrid, "Grid view"],
            ] as const
          ).map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              aria-label={label}
              onClick={() => setView(key)}
              className={cn(
                "grid size-10 place-items-center transition-colors",
                view === key ? "bg-foreground text-background" : "hover:bg-muted",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {showPodium && <Podium items={top} />}

        {rest.length > 0 && (
          <>
            {showPodium && <p className="eyebrow mt-8 mb-3">Ranks 04 onward</p>}

            {view === "rows" ? (
              <ul className="border-t">
                {rest.map((c, i) => (
                  <RankingRow key={c.id} c={c} position={offset + i + 1} />
                ))}
              </ul>
            ) : (
              <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
                {rest.map((c, i) => (
                  <RankingCard key={c.id} c={c} position={offset + i + 1} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}