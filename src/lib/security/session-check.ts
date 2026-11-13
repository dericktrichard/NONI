/** Session errors that mean the cookie itself is bad. Anything else (timeouts, network) says nothing about the user. */
const REJECTED = new Set([
  "auth/session-cookie-expired",
  "auth/session-cookie-revoked",
  "auth/invalid-session-cookie",
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
  "auth/user-disabled",
  "auth/user-not-found",
]);

export function isRejection(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && REJECTED.has(code);
}

/** Rejects with a timeout error when the promise takes longer than `ms` */
export function within<T>(ms: number, promise: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Object.assign(new Error("timeout"), { code: "noni/timeout" })),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** A small expiring memory cache. It never holds an entry longer than `until`, when one is given. */
export function createTrust<T>(ttlMs: number, max: number, now: () => number = Date.now) {
  const items = new Map<string, { value: T; until: number }>();
  return {
    get(key: string): T | undefined {
      const hit = items.get(key);
      if (!hit) return undefined;
      if (hit.until <= now()) {
        items.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key: string, value: T, until = Number.POSITIVE_INFINITY): void {
      if (items.size >= max) items.clear();
      items.set(key, { value, until: Math.min(now() + ttlMs, until) });
    },
    delete(key: string): void {
      items.delete(key);
    },
  };
}
