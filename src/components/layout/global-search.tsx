"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Portrait } from "@/components/characters/portrait";
import { TierBadge } from "@/components/characters/tier-badge";
import { ProfileAvatar } from "@/components/profile/banner";
import { useCharacterSearch } from "@/hooks/use-character-search";
import { usePeopleSearch } from "@/hooks/use-people-search";
import { peopleTerm } from "@/lib/people/term";
import { OPEN_SEARCH } from "@/lib/ui/events";
import { cn } from "@/lib/utils";

function SearchPanel({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const { change, results, list, failed } = useCharacterSearch();
  const { people, search } = usePeopleSearch();
  const [typed, setTyped] = useState("");
  const [active, setActive] = useState(0);

  const mention = typed.trim().startsWith("@");
  const characters = mention ? [] : list;
  const targets = [
    ...characters.map((c) => `/characters/${c.id}`),
    ...people.map((p) => `/u/${p.handle}`),
  ];
  const noCharacters = !mention && results !== null && results.length === 0;
  const empty =
    people.length === 0 && (mention ? peopleTerm(typed) !== null : noCharacters);

  function onChange(value: string) {
    setActive(0);
    setTyped(value);
    change(value.trim().startsWith("@") ? "" : value);
    search(value);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, targets.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      const href = targets[active];
      if (href) {
        event.preventDefault();
        onDone();
        router.push(href);
      }
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 border-b px-4">
        <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <input
          autoFocus
          value={typed}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          maxLength={60}
          placeholder="Search characters, verses or @people"
          aria-label="Search characters, verses or people"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          className="placeholder:text-muted-foreground h-14 min-w-0 flex-1 bg-transparent text-base outline-none"
        />
        <button
          type="button"
          onClick={onDone}
          className="eyebrow hover:bg-muted border px-2 py-1"
        >
          Esc
        </button>
      </div>

      {empty ? (
        <p className="text-muted-foreground p-4 text-sm">
          {failed ? "Search is unavailable right now." : "Nothing matches that."}
        </p>
      ) : (
        <div className="max-h-[55svh] overflow-y-auto">
          {characters.length > 0 ? (
            <>
              <p className="eyebrow border-b px-4 py-2">
                {results ? "Results" : "Top ranked"}
              </p>
              <ul className="divide-y">
                {characters.map((c, index) => (
                  <li key={c.id}>
                    <Link
                      href={`/characters/${c.id}`}
                      onClick={onDone}
                      onMouseEnter={() => setActive(index)}
                      className={cn(
                        "flex items-center gap-3 p-3",
                        index === active && "bg-muted",
                      )}
                    >
                      <Portrait
                        name={c.name}
                        src={c.imageUrl}
                        sizes="40px"
                        className="aspect-2/3 w-9 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-display block truncate text-base font-semibold">
                          {c.name}
                        </span>
                        <span className="eyebrow block truncate">{c.verse}</span>
                      </span>
                      <TierBadge tier={c.tier} />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {people.length > 0 ? (
            <>
              <p
                className={cn(
                  "eyebrow border-b px-4 py-2",
                  characters.length > 0 && "border-t",
                )}
              >
                People
              </p>
              <ul className="divide-y">
                {people.map((person, index) => {
                  const position = characters.length + index;
                  return (
                    <li key={person.handle}>
                      <Link
                        href={`/u/${person.handle}`}
                        onClick={onDone}
                        onMouseEnter={() => setActive(position)}
                        className={cn(
                          "flex items-center gap-3 p-3",
                          position === active && "bg-muted",
                        )}
                      >
                        <ProfileAvatar
                          look={person.look}
                          handle={person.handle}
                          className="size-9 p-0.5"
                        />
                        <span className="min-w-0 flex-1 truncate text-base font-medium">
                          @{person.handle}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>
      )}

      {!results && !mention && typed.trim().length > 0 ? (
        <p className="text-muted-foreground border-t p-3 text-xs">
          Type at least 2 letters to search.
        </p>
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
      const shortcut =
        (event.key === "/" && !typing) ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k");
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
        aria-label="Search"
        className="text-muted-foreground hover:border-foreground hover:text-foreground hidden h-10 items-center gap-3 border px-3 text-sm transition-colors sm:flex"
      >
        <Search className="size-4" aria-hidden />
        <span>Search</span>
        <kbd className="eyebrow border px-1.5">/</kbd>
      </button>

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        aria-label="Search"
        className="bg-background text-foreground mx-auto mt-[12svh] mb-auto w-[calc(100%-2rem)] max-w-xl border p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        {open ? <SearchPanel onDone={() => ref.current?.close()} /> : null}
      </dialog>
    </>
  );
}
