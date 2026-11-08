"use client";

import { Plus, X } from "lucide-react";
import { Portrait } from "@/components/characters/portrait";
import type { BattleCard } from "@/lib/battle/view";
import { cn } from "@/lib/utils";

interface TeamRowProps {
  title: string;
  size: number;
  team: BattleCard[];
  active: boolean;
  onActivate: () => void;
  onRemove: (slug: string) => void;
  actions: React.ReactNode;
}

export function TeamRow({ title, size, team, active, onActivate, onRemove, actions }: TeamRowProps) {
  return (
    <section aria-label={title} className={cn("border p-3 sm:p-4", active && "border-foreground")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="eyebrow">{title}</h2>
        <div className="flex gap-2">{actions}</div>
      </div>

      <ul className={cn("mt-3 grid gap-2", size === 3 ? "grid-cols-3" : "grid-cols-5")}>
        {Array.from({ length: size }, (_, index) => {
          const card = team[index];
          return (
            <li key={card?.slug ?? `empty-${index}`}>
              {card ? (
                <button
                  type="button"
                  onClick={() => onRemove(card.slug)}
                  aria-label={`Remove ${card.name}`}
                  className="group relative block w-full text-left"
                >
                  <Portrait name={card.name} src={card.imageUrl} sizes="120px" className="aspect-2/3 w-full" />
                  <span className="absolute top-1 right-1 grid size-5 place-items-center bg-background/90 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <X className="size-3" aria-hidden />
                  </span>
                  <span className="mt-1 block truncate text-xs font-medium">{card.name}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onActivate}
                  aria-label={`Add to ${title}`}
                  className="grid aspect-2/3 w-full place-items-center border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}