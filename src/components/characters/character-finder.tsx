"use client";

import { Portrait } from "@/components/characters/portrait";
import { useCharacterSearch } from "@/hooks/use-character-search";
import type { CharacterSummary } from "@/types/character";

interface CharacterFinderProps {
  label: string;
  onPick: (character: CharacterSummary) => void;
  isDisabled?: (character: CharacterSummary) => boolean;
  needArt?: boolean;
}

export function CharacterFinder({ label, onPick, isDisabled, needArt }: CharacterFinderProps) {
  const { text, change, results, list, failed } = useCharacterSearch(10);
  const shown = needArt ? list.filter((item) => item.imageUrl !== null) : list;

  return (
    <div>
      <label className="block">
        <span className="eyebrow mb-1 block">{label}</span>
        <input
          value={text}
          onChange={(event) => change(event.target.value)}
          maxLength={60}
          placeholder="Name or verse"
          autoComplete="off"
          spellCheck={false}
          className="h-11 w-full border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground"
        />
      </label>

      <p className="eyebrow mt-3 mb-2">{results ? "Results" : "Top ranked"}</p>
      {results && shown.length === 0 ? (
        <p className="border p-3 text-sm text-muted-foreground">
          {failed ? "Search is unavailable right now." : needArt ? "No character with art matches that." : "No character matches that."}
        </p>
      ) : (
        <ul className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto border p-2 sm:grid-cols-5">
          {shown.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onPick(c)}
                disabled={isDisabled?.(c) ?? false}
                className="group block w-full text-left disabled:opacity-40"
              >
                <Portrait name={c.name} src={c.imageUrl} sizes="96px" className="aspect-2/3 w-full" />
                <span className="mt-1 block truncate text-xs font-medium group-hover:underline">{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}