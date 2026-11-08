export type Reply<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export async function postJson<T>(url: string, body: unknown): Promise<Reply<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: unknown = await response.json().catch(() => null);
    if (response.ok) return { ok: true, data: json as T };
    const error = (json as { error?: unknown } | null)?.error;
    return { ok: false, status: response.status, error: typeof error === "string" ? error : "Something went wrong." };
  } catch {
    return { ok: false, status: 0, error: "Network problem. Try again." };
  }
}