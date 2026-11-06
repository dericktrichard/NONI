"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Portrait } from "@/components/characters/portrait";
import { TierBadge } from "@/components/characters/tier-badge";
import { facetQueryString, searchTerm } from "@/lib/data/query";
import type { CharacterPage } from "@/lib/data/summary";
import { OPEN_SEARCH } from "@/lib/ui/events";
import { cn } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";

function SearchPanel({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [results, setResults] = useState<CharacterSummary[] | null>(null);
  const [popular, setPopular] = useState<CharacterSummary[]>([]);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef(0);

  useEffect(() => {
    let live = true;
    fetch("/api/characters?limit=6")
      .then((response) => (response.ok ? response.json() : null))
      .then((page: CharacterPage | null) => {
        if (live && page) setPopular(page.items);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  function change(value: string) {
    setText(value);
    setActive(0);
    clearTimeout(timer.current);

    const term = searchTerm(value);
    if (!term) {
      latest.current += 1;
      setResults(null);
      return;
    }

    const ticket = ++latest.current;
    timer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/characters?${facetQueryString({ kind: "search", term }, null, 12)}`);
        if (!response.ok) throw new Error("search failed");
        const page = (await response.json()) as CharacterPage;
        if (ticket !== latest.current) return;
        const words = value.toLowerCase().split(/\s+/).filter(Boolean);
        setResults(page.items.filter((item) => words.every((word) => `${item.name} ${item.verse}`.toLowerCase().includes(word))));
        setFailed(false);
      } catch {
        if (ticket !== latest.current) return;
        setFailed(true);
        setResults([]);
      }
    }, 220);
  }

  const list = results ?? popular;

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, list.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      const pick = list[active];
      if (pick) {
        event.preventDefault();
        onDone();
        router.push(`/characters/${pick.id}`);
      }
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 border-b px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          autoFocus
          value={text}
          onChange={(event) => change(event.target.value)}
          onKeyDown={onKeyDown}
          maxLength={60}
          placeholder="Search characters or verses"
          aria-label="Search characters or verses"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        <button type="button" onClick={onDone} className="eyebrow border px-2 py-1 hover:bg-muted">
          Esc
        </button>
      </div>

      <p className="eyebrow border-b px-4 py-2">{results ? "Results" : "Top ranked"}</p>

      {results && results.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          {failed ? "Search is unavailable right now." : "No character matches that."}
        </p>
      ) : (
        <ul className="max-h-[55svh] divide-y overflow-y-auto">
          {list.map((c, index) => (
            <li key={c.id}>
              <Link
                href={`/characters/${c.id}`}
                onClick={onDone}
                onMouseEnter={() => setActive(index)}
                className={cn("flex items-center gap-3 p-3", index === active && "bg-muted")}
              >
                <Portrait name={c.name} src={c.imageUrl} sizes="40px" className="aspect-2/3 w-9 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base font-semibold">{c.name}</span>
                  <span className="eyebrow block truncate">{c.verse}</span>
                </span>
                <TierBadge tier={c.tier} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!results && text.trim().length > 0 ? (
        <p className="border-t p-3 text-xs text-muted-foreground">Type at least 2 letters to search.</p>
      ) : null}
    </div>
  );
}

export function GlobalSearch() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const show = () => setOpen(true);
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target !== null &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      const shortcut = (event.key === "/" && !typing) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k");
      if (shortcut) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener(OPEN_SEARCH, show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_SEARCH, show);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search characters"
        className="hidden h-10 items-center gap-3 border px-3 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:flex"
      >
        <Search className="size-4" aria-hidden />
        <span>Search</span>
        <kbd className="eyebrow border px-1.5">/</kbd>
      </button>

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        aria-label="Search characters"
        className="mx-auto mt-[12svh] mb-auto w-[calc(100%-2rem)] max-w-xl border bg-background p-0 text-foreground backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        {open ? <SearchPanel onDone={() => ref.current?.close()} /> : null}
      </dialog>
    </>
  );
}