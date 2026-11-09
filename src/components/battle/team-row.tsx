"use client";

import { X } from "lucide-react";
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

const Slot = ({ n }: { n: number }) => (
  <span className="tabular absolute top-0.5 left-0.5 z-10 grid size-4 place-items-center bg-background/90 text-[10px] font-semibold">{n}</span>
);

export function TeamRow({ title, size, team, active, onActivate, onRemove, actions }: TeamRowProps) {
  return (
    <section aria-label={title} className={cn("border p-2 transition-colors", active && "border-foreground")}>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onActivate} className="flex items-center gap-1.5 font-display text-base font-semibold">
          {active ? <span className="size-1.5 bg-accent" aria-hidden /> : null}
          {title}
        </button>
        <div className="flex gap-1">{actions}</div>
      </div>

      <ul className={cn("mt-2 grid gap-1.5", size === 3 ? "grid-cols-3" : "grid-cols-5")}>
        {Array.from({ length: size }, (_, index) => {
          const card = team[index];
          return (
            <li key={card?.slug ?? `empty-${index}`} className="relative">
              <Slot n={index + 1} />
              {card ? (
                <button type="button" onClick={() => onRemove(card.slug)} aria-label={`Remove ${card.name}`} className="group relative block w-full text-left">
                  <Portrait name={card.name} src={card.imageUrl} sizes="96px" className="aspect-square w-full" />
                  <span className="absolute top-0.5 right-0.5 grid size-4 place-items-center bg-background/90 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <X className="size-3" aria-hidden />
                  </span>
                  <span className="mt-0.5 hidden truncate text-[10px] font-medium sm:block">{card.name}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onActivate}
                  aria-label={`Add to ${title}`}
                  className="block aspect-square w-full border border-dashed text-muted-foreground transition-colors hover:border-foreground"
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}