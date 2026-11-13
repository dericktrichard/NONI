/** Keeps the result of an async load for `ttlMs`. Simultaneous callers share one load, and a failure is never kept. */
export function memoAsync<T>(
  ttlMs: number,
  load: () => Promise<T>,
  now: () => number = Date.now,
) {
  let kept: { data: T; until: number } | null = null;
  let inflight: Promise<T> | null = null;

  return async (): Promise<T> => {
    if (kept && kept.until > now()) return kept.data;
    inflight ??= load()
      .then((data) => {
        kept = { data, until: now() + ttlMs };
        return data;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };
}
