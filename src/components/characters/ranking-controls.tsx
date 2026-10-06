"use client";

import { LayoutGrid, List, Search, X } from "lucide-react";
import { MEDIA_LABELS, MEDIA_TYPES } from "@/config/media";
import { TIER_GROUPS } from "@/config/scales";
import { SEARCH } from "@/lib/data/query";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/types/character";

export type View = "rows" | "grid";

/** Strongest first: Boundless, Extradimensional, Multiversal, Cosmic, and so on down */
const TIER_OPTIONS = Object.entries(TIER_GROUPS)
  .map(([group, name]) => ({ group: Number(group), name }))
  .sort((a, b) => a.group - b.group);

interface ToolbarProps {
  searchText: string;
  tier: number | null;
  onSearchText: (text: string) => void;
  onTier: (group: number | null) => void;
}

/** Search box and power-scale picker. Not sticky, so it never eats phone screen. */
export function RankingToolbar({ searchText, tier, onSearchText, onTier }: ToolbarProps) {
  return (
    <div className="flex flex-col gap-2 pb-3 sm:flex-row">
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={searchText}
          onChange={(event) => onSearchText(event.target.value)}
          placeholder="Search characters or verses"
          aria-label="Search characters or verses"
          maxLength={SEARCH.maxInput}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          className="h-11 w-full rounded-sm border bg-transparent pr-11 pl-9 text-sm placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none"
        />
        {searchText.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onSearchText("")}
            className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-sm hover:bg-muted"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <select
        value={tier === null ? "" : String(tier)}
        onChange={(event) => onTier(event.target.value === "" ? null : Number(event.target.value))}
        aria-label="Filter by power scale"
        className="h-11 rounded-sm border bg-background px-3 text-sm sm:w-56"
      >
        <option value="">All power scales</option>
        {TIER_OPTIONS.map(({ group, name }) => (
          <option key={group} value={group}>
            {`Tier ${group}: ${name}`}
          </option>
        ))}
      </select>
    </div>
  );
}

interface FilterBarProps {
  media: MediaType | null;
  view: View;
  onMedia: (media: MediaType | null) => void;
  onView: (view: View) => void;
}

/** Sticky under the header: media chips and the list/grid switch */
export function RankingFilterBar({ media, view, onMedia, onView }: FilterBarProps) {
  const chips: Array<{ key: MediaType | null; label: string }> = [
    { key: null, label: "All" },
    ...MEDIA_TYPES.map((type) => ({ key: type as MediaType | null, label: MEDIA_LABELS[type] })),
  ];

  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 -mx-4 flex items-center gap-3 border-b bg-background px-4 py-2">
      <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
        {chips.map((chip) => {
          const active = media === chip.key;
          return (
            <button
              key={chip.label}
              type="button"
              aria-pressed={active}
              onClick={() => onMedia(chip.key)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center rounded-sm border px-3 text-sm font-medium transition-colors",
                active ? "border-foreground bg-foreground text-background" : "bg-transparent hover:bg-muted",
              )}
            >
              {chip.label}
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
            onClick={() => onView(key)}
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
  );
}
