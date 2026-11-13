"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { facetQueryString, searchTerm } from "@/lib/data/query";
import type { CharacterPage } from "@/lib/data/summary";
import type { CharacterSummary } from "@/types/character";

const DELAY_MS = 220;

export function useCharacterSearch(resultLimit = 12) {
  const [text, setText] = useState("");
  const [results, setResults] = useState<CharacterSummary[] | null>(null);
  const [popular, setPopular] = useState<CharacterSummary[]>([]);
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

  const change = useCallback(
    (value: string) => {
      setText(value);
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
          const response = await fetch(
            `/api/characters?${facetQueryString({ kind: "search", term }, null, resultLimit)}`,
          );
          if (!response.ok) throw new Error("search failed");
          const page = (await response.json()) as CharacterPage;
          if (ticket !== latest.current) return;
          const words = value.toLowerCase().split(/\s+/).filter(Boolean);
          setResults(
            page.items.filter((item) =>
              words.every((word) =>
                `${item.name} ${item.verse}`.toLowerCase().includes(word),
              ),
            ),
          );
          setFailed(false);
        } catch {
          if (ticket !== latest.current) return;
          setFailed(true);
          setResults([]);
        }
      }, DELAY_MS);
    },
    [resultLimit],
  );

  return { text, change, results, list: results ?? popular, failed };
}
