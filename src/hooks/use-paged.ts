"use client";

import { useCallback, useState } from "react";
import type { Page } from "@/lib/paging/rules";

/** A first page from the server, then more pages on demand. Items already shown are never repeated. */
export function usePaged<T, N>(
  initial: Page<T, N>,
  load: (next: N) => Promise<Page<T, N> | null>,
  keyOf: (item: T) => string,
) {
  const [items, setItems] = useState(initial.items);
  const [next, setNext] = useState<N | null>(initial.next);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const more = useCallback(async () => {
    if (next === null || busy) return;
    setBusy(true);
    setFailed(false);
    const page = await load(next).catch(() => null);
    if (page) {
      setItems((current) => {
        const seen = new Set(current.map(keyOf));
        return [...current, ...page.items.filter((item) => !seen.has(keyOf(item)))];
      });
      setNext(page.next);
    } else {
      setFailed(true);
    }
    setBusy(false);
  }, [next, busy, load, keyOf]);

  return { items, hasMore: next !== null, busy, failed, more };
}
