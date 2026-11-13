"use client";

import { LayoutGrid, List, Search } from "lucide-react";
import { MEDIA_LABELS, MEDIA_TYPES } from "@/config/media";
import { TIER_GROUPS } from "@/config/scales";
import type { View } from "@/lib/explore/params";
import { OPEN_SEARCH } from "@/lib/ui/events";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/types/character";

export type ChipKey = "overview" | "all" | MediaType;

/** Strongest first: Boundless, Extradimensional, Multiversal, Cosmic, and so on down */
const TIER_OPTIONS = Object.entries(TIER_GROUPS)
  .map(([group, name]) => ({ group: Number(group), name }))
  .sort((a, b) => a.group - b.group);

const ACTIVE =
  "border-foreground bg-foreground text-background [box-shadow:inset_0_-2px_0_var(--color-accent)]";

interface ToolbarProps {
  tier: number | null;
  onTier: (group: number | null) => void;
}

export function ExploreToolbar({ tier, onTier }: ToolbarProps) {
  return (
    <div className="flex flex-col gap-2 pb-3 sm:flex-row">
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH))}
        className="text-muted-foreground hover:border-foreground hover:text-foreground flex h-11 min-w-0 flex-1 items-center gap-3 border px-3 text-left text-sm transition-colors"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate">Search characters or verses</span>
        <kbd className="eyebrow hidden border px-1.5 sm:block">/</kbd>
      </button>

      <select
        value={tier === null ? "" : String(tier)}
        onChange={(event) =>
          onTier(event.target.value === "" ? null : Number(event.target.value))
        }
        aria-label="Filter by power scale"
        className="bg-background focus:border-foreground h-11 border px-3 text-sm outline-none sm:w-56"
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
  active: ChipKey | null;
  view: View;
  showView: boolean;
  onSelect: (key: ChipKey) => void;
  onView: (view: View) => void;
}

const CHIPS: Array<{ key: ChipKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "all", label: "All" },
  ...MEDIA_TYPES.map((type) => ({ key: type as ChipKey, label: MEDIA_LABELS[type] })),
];

/** Floats just under the nav while scrolling: where to look, and how to lay it out */
export function ExploreFilterBar({
  active,
  view,
  showView,
  onSelect,
  onView,
}: FilterBarProps) {
  return (
    <div className="sticky top-[calc(var(--nav-space)+0.5rem)] z-30">
      <div className="acrylic flex items-center gap-3 px-3 py-2">
        <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {CHIPS.map((chip) => {
            const selected = active === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(chip.key)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center border px-3 text-sm font-medium transition-colors",
                  selected
                    ? ACTIVE
                    : "border-border hover:bg-foreground/10 bg-transparent",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {showView ? (
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
                  view === key
                    ? "bg-foreground text-background"
                    : "hover:bg-foreground/10",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
