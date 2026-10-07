export interface WindowState {
  count: number;
  start: number;
}

export interface Decision {
  allowed: boolean;
  next: WindowState;
  retryAfterSeconds: number;
}

export function decide(state: WindowState | undefined, now: number, limit: number, windowMs: number): Decision {
  let current: WindowState;
  if (!state || now < state.start || now - state.start >= windowMs) current = { count: 0, start: now };
  else current = state;

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.start + windowMs - now) / 1000));
    return { allowed: false, next: current, retryAfterSeconds };
  }
  return { allowed: true, next: { count: current.count + 1, start: current.start }, retryAfterSeconds: 0 };
}

export function createMemoryLimiter(limit: number, windowMs: number, maxKeys = 5000) {
  const hits = new Map<string, WindowState>();

  return (key: string, now: number = Date.now()): Decision => {
    if (hits.size >= maxKeys && !hits.has(key)) {
      for (const [stored, state] of hits) if (now - state.start >= windowMs) hits.delete(stored);
      if (hits.size >= maxKeys) {
        return { allowed: false, next: { count: limit, start: now }, retryAfterSeconds: Math.ceil(windowMs / 1000) };
      }
    }
    const decision = decide(hits.get(key), now, limit, windowMs);
    hits.set(key, decision.next);
    return decision;
  };
}