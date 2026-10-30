"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/fields";
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
const plainButton = "min-h-11 border px-4 text-sm hover:bg-foreground/5 disabled:opacity-50";

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
    <div className="mt-8 max-w-2xl space-y-8">
      <ul className="border-t">
        {lists.map((list) => (
          <li key={list.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-4">
            <div>
              <p className="font-medium">{list.title}</p>
              <p className="text-sm text-muted-foreground">
                {list.items.length} {list.items.length === 1 ? "entry" : "entries"}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className={plainButton} onClick={() => startEdit(list)} disabled={busy}>
                Edit
              </button>
              <button type="button" className={plainButton} onClick={() => remove(list.id)} disabled={busy}>
                Delete
              </button>
            </div>
          </li>
        ))}
        {lists.length === 0 ? <li className="py-4 text-sm text-muted-foreground">No lists yet.</li> : null}
      </ul>

      {editing === null ? (
        <button type="button" className={plainButton} onClick={startNew} disabled={lists.length >= MAX_LISTS}>
          {lists.length >= MAX_LISTS ? `Limit of ${MAX_LISTS} lists reached` : "New list"}
        </button>
      ) : (
        <form onSubmit={save} className="space-y-6 border p-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={TITLE_MAX}
              required
              className={controlClass}
            />
          </label>

          <ol className="space-y-4">
            {rows.map((row, index) => (
              <li key={index} className="space-y-2 border-t pt-4">
                <div className="flex items-center gap-2">
                  <span className="tabular w-6 text-sm text-muted-foreground">{index + 1}</span>
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
                </div>
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
                  <button type="button" className={plainButton} onClick={() => move(index, -1)} disabled={index === 0}>
                    Up
                  </button>
                  <button
                    type="button"
                    className={plainButton}
                    onClick={() => move(index, 1)}
                    disabled={index === rows.length - 1}
                  >
                    Down
                  </button>
                  <button type="button" className={plainButton} onClick={() => removeRow(index)} disabled={rows.length === 1}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={plainButton}
              onClick={() => setRows((current) => [...current, emptyRow()])}
              disabled={rows.length >= MAX_ITEMS}
            >
              Add a character
            </button>
            <Button type="submit" variant="primary" disabled={busy || !ready}>
              Save list
            </Button>
            <button type="button" className={plainButton} onClick={() => setEditing(null)} disabled={busy}>
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