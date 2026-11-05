"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { controlClass } from "@/components/ui/fields";
import { Tri } from "@/components/ui/tri";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import type { CharacterOption, UserList } from "@/lib/data/lists";
import { MAX_ITEMS, MAX_LISTS, REASON_MAX, REASON_MIN, TITLE_MAX, TITLE_MIN } from "@/lib/lists/rules";

interface Row {
  characterId: string;
  reason: string;
}

interface ListsManagerProps {
  lists: UserList[];
  options: CharacterOption[];
}

const emptyRow = (): Row => ({ characterId: "", reason: "" });

export function ListsManager({ lists, options }: ListsManagerProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready =
    title.trim().length >= TITLE_MIN &&
    rows.every((row) => row.characterId !== "" && row.reason.trim().length >= REASON_MIN);

  function startNew() {
    setEditing("new");
    setTitle("");
    setRows([emptyRow()]);
    setError(null);
  }

  function startEdit(list: UserList) {
    setEditing(list.id);
    setTitle(list.title);
    setRows(list.items.map((item) => ({ characterId: item.characterId, reason: item.reason })));
    setError(null);
  }

  function patchRow(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function move(index: number, delta: number) {
    setRows((current) => {
      const next = index + delta;
      if (next < 0 || next >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[next]] = [copy[next]!, copy[index]!];
      return copy;
    });
  }

  function removeRow(index: number) {
    setRows((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));
  }

  async function call(url: string, method: "POST" | "PUT", body: unknown): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event(OPEN_SIGN_IN));
        setError("Sign in to continue.");
        return false;
      }
      if (response.ok) return true;
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Something went wrong.");
      return false;
    } catch {
      setError("Network error. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || editing === null) return;
    const body = {
      title: title.trim(),
      items: rows.map((row) => ({ characterId: row.characterId, reason: row.reason.trim() })),
    };
    const creating = editing === "new";
    const ok = await call(creating ? "/api/lists" : `/api/lists/${editing}`, creating ? "POST" : "PUT", body);
    if (ok) {
      setEditing(null);
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this list?")) return;
    const ok = await call(`/api/lists/${id}/delete`, "POST", {});
    if (ok) {
      if (editing === id) setEditing(null);
      router.refresh();
    }
  }

  return (
    <div className="mt-8 max-w-2xl space-y-6">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">
          {lists.length} of {MAX_LISTS} lists
        </p>
      </div>

      {lists.length > 0 ? (
        <ul className="space-y-3">
          {lists.map((list) => (
            <li key={list.id} className="flex flex-wrap items-center justify-between gap-3 border p-4">
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold">{list.title}</p>
                <p className="text-sm text-muted-foreground">
                  {list.items.length} {list.items.length === 1 ? "entry" : "entries"}
                </p>
                {list.status === "hidden" ? (
                  <p className="mt-1 text-sm font-medium">Hidden by a moderator. It is not shown on your profile.</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-line btn-sm" onClick={() => startEdit(list)} disabled={busy}>
                  Edit
                </button>
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => remove(list.id)} disabled={busy}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border p-4 text-sm text-muted-foreground">No lists yet.</p>
      )}

      {editing === null ? (
        <button type="button" className="btn btn-solid" onClick={startNew} disabled={lists.length >= MAX_LISTS}>
          {lists.length >= MAX_LISTS ? `Limit of ${MAX_LISTS} lists reached` : "New list"}
        </button>
      ) : (
        <form onSubmit={save} className="space-y-6 border p-4 sm:p-6">
          <label className="block text-sm">
            <span className="eyebrow mb-1 block">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={TITLE_MAX}
              required
              className={controlClass}
            />
          </label>

          <ol className="space-y-3">
            {rows.map((row, index) => (
              <li key={index} className="grid grid-cols-[2.5rem_1fr] border">
                <span className="tabular grid place-items-center border-r bg-muted font-display text-lg font-semibold">
                  {index + 1}
                </span>
                <div className="space-y-2 p-3">
                  <select
                    value={row.characterId}
                    onChange={(event) => patchRow(index, { characterId: event.target.value })}
                    aria-label={`Character ${index + 1}`}
                    required
                    className={controlClass}
                  >
                    <option value="">Choose a character</option>
                    {options.map((option) => (
                      <option
                        key={option.id}
                        value={option.id}
                        disabled={rows.some((other, i) => i !== index && other.characterId === option.id)}
                      >
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={row.reason}
                    onChange={(event) => patchRow(index, { reason: event.target.value })}
                    maxLength={REASON_MAX}
                    placeholder="Why this character is here"
                    aria-label={`Reason ${index + 1}`}
                    required
                    className={controlClass}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-line btn-sm"
                      aria-label="Move up"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                    >
                      <Tri dir="up" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-line btn-sm"
                      aria-label="Move down"
                      onClick={() => move(index, 1)}
                      disabled={index === rows.length - 1}
                    >
                      <Tri dir="down" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-quiet btn-sm"
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <button
            type="button"
            className="btn btn-line btn-sm"
            onClick={() => setRows((current) => [...current, emptyRow()])}
            disabled={rows.length >= MAX_ITEMS}
          >
            Add a character
          </button>

          <div className="flex flex-wrap gap-3 border-t pt-5">
            <button type="submit" className="btn btn-solid" disabled={busy || !ready}>
              Save list
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}