"use client";

import { useCallback, useState } from "react";

export interface Reveal {
  count: number;
  more: boolean;
  showMore: () => void;
}

/** Shows step items at first and step more each time showMore is called */
export function useReveal(total: number, step = 6): Reveal {
  const [count, setCount] = useState(step);
  const showMore = useCallback(
    () => setCount((current) => Math.min(total, current + step)),
    [total, step],
  );
  return { count: Math.min(count, total), more: count < total, showMore };
}
