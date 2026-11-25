"use client";

import Link from "next/link";
import { useState } from "react";
import { PublishButton } from "@/components/admin/publish-button";
import { TierBadge } from "@/components/characters/tier-badge";
import type { listCharacters } from "@/lib/data/admin-characters";
import { cn } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listCharacters>>[number];
type Filter = "all" | "drafts" | "ranked";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "drafts", label: "Drafts" },
  { key: "ranked", label: "Ranked" },
];

const PAGE = 100;

export function CharacterTable({ characters }: { characters: Row[] }) {
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE);

  const needle = text.trim().toLowerCase();
  const rows = characters.filter((c) => {
    if (filter === "drafts" && !c.draft) return false;
    if (filter === "ranked" && c.draft) return false;
    return (
      needle === "" ||
      c.name.toLowerCase().includes(needle) ||
      c.verse.toLowerCase().includes(needle)
    );
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter characters" className="flex border-b">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => {
                setFilter(key);
                setShown(PAGE);
              }}
              className={cn(
                "hover:bg-muted h-10 border-b-2 border-transparent px-4 text-sm font-medium transition-colors",
                filter === key && "border-b-accent",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setShown(PAGE);
          }}
          placeholder="Search name or verse"
          aria-label="Search characters"
          autoComplete="off"
          spellCheck={false}
          className="bg-background placeholder:text-muted-foreground focus:border-foreground h-10 w-full border px-3 text-sm outline-none sm:w-64"
        />
      </div>

      <p className="eyebrow mt-3">
        {rows.length} {rows.length === 1 ? "character" : "characters"}
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground mt-3 border p-4 text-sm">
          No character matches that.
        </p>
      ) : (
        <ul className="mt-3 divide-y border">
          {rows.slice(0, shown).map((character) => (
            <li
              key={character.slug}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
            >
              <span className="eyebrow tabular w-12 shrink-0">
                {character.draft ? "Draft" : (character.rank ?? "--")}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/characters/${character.slug}`}
                  className="font-medium underline underline-offset-4"
                >
                  {character.name}
                </Link>
                <p className="eyebrow truncate">
                  {character.verse} / {character.verifiedFeatCount} of{" "}
                  {character.featCount} feats verified
                </p>
              </div>
              <TierBadge tier={character.tier} />
              {character.draft ? <PublishButton slug={character.slug} /> : null}
              <Link
                href={`/admin/characters/${character.slug}/edit`}
                className="btn btn-line btn-sm"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}

      {rows.length > shown ? (
        <button
          type="button"
          className="btn btn-line btn-sm mt-4"
          onClick={() => setShown((value) => value + PAGE)}
        >
          Show {Math.min(PAGE, rows.length - shown)} more
        </button>
      ) : null}
    </div>
  );
}
