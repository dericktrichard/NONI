"use client";

import { useCallback, useRef, useState } from "react";
import type { PersonHit } from "@/lib/data/people";
import { peopleTerm } from "@/lib/people/term";

const DELAY_MS = 260;

export function usePeopleSearch() {
  const [people, setPeople] = useState<PersonHit[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef(0);

  const search = useCallback((value: string) => {
    clearTimeout(timer.current);
    const ticket = ++latest.current;
    const term = peopleTerm(value);
    if (!term) {
      setPeople([]);
      return;
    }

    timer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/people?q=${encodeURIComponent(term)}`);
        const data = response.ok
          ? ((await response.json()) as { people: PersonHit[] })
          : null;
        if (ticket === latest.current) setPeople(data?.people ?? []);
      } catch {
        if (ticket === latest.current) setPeople([]);
      }
    }, DELAY_MS);
  }, []);

  return { people, search };
}
