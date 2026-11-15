"use client";

import { useState } from "react";
import { Portrait } from "@/components/characters/portrait";
import { useRoster } from "@/hooks/use-roster";
import type { BattleCard } from "@/lib/battle/view";
import { sharedEntities } from "@/lib/versions/rules";

interface RosterPickerProps {
  label: string;
  taken: ReadonlySet<string>;
  /** Entities already on the team being built, so their other versions are disabled */
  blocked?: ReadonlySet<string>;
  onPick: (card: BattleCard) => void;
}

/** Alphabetical, searchable and deliberately free of ranks and stats */
export function RosterPicker({ label, taken, blocked, onPick }: RosterPickerProps) {
  const { cards, failed } = useRoster();
  const [text, setText] = useState("");
  const query = text.trim().toLowerCase();
  const shared = sharedEntities(
    (cards ?? []).map((card) => ({ id: card.slug, entity: card.entity })),
  );
  const shown = cards?.filter(
    (c) =>
      !query ||
      c.name.toLowerCase().includes(query) ||
      c.verse.toLowerCase().includes(query),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <label className="block">
        <span className="eyebrow mb-1 block">{label}</span>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={60}
          placeholder="Search name or verse"
          autoComplete="off"
          spellCheck={false}
          className="bg-background placeholder:text-muted-foreground focus:border-foreground h-9 w-full border px-3 text-sm outline-none"
        />
      </label>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto border p-1.5">
        {!shown ? (
          <p className="text-muted-foreground p-2 text-sm">
            {failed ? "The roster is unavailable right now." : "Loading the roster..."}
          </p>
        ) : shown.length === 0 ? (
          <p className="text-muted-foreground p-2 text-sm">No character matches that.</p>
        ) : (
          <ul className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-5 xl:grid-cols-7">
            {shown.map((card) => (
              <li key={card.slug}>
                <button
                  type="button"
                  title={
                    blocked?.has(card.entity ?? card.slug) && !taken.has(card.slug)
                      ? `${card.name}, another version is on this team`
                      : `${card.name} (${card.verse})`
                  }
                  disabled={
                    taken.has(card.slug) ||
                    blocked?.has(card.entity ?? card.slug) === true
                  }
                  onClick={() => onPick(card)}
                  className="group block w-full text-left disabled:opacity-30"
                >
                  <Portrait
                    name={card.name}
                    src={card.imageUrl}
                    sizes="96px"
                    className="aspect-square w-full"
                  />
                  <span className="mt-0.5 block truncate text-[10px] font-medium group-hover:underline">
                    {card.name}
                  </span>
                  {shared.has(card.entity ?? card.slug) && card.version ? (
                    <span className="text-muted-foreground block truncate text-[9px]">
                      {card.version}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
