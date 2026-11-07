"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CharacterFinder } from "@/components/characters/character-finder";
import { Portrait } from "@/components/characters/portrait";
import { controlClass } from "@/components/ui/fields";
import { Tri } from "@/components/ui/tri";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import type { UserList } from "@/lib/data/lists";
import {
  MAX_ITEMS,
  MAX_LISTS,
  REASON_MAX,
  REASON_MIN,
  TITLE_MAX,
  TITLE_MIN,
  type Visibility,
} from "@/lib/lists/rules";
import { cn } from "@/lib/utils";
import type { CharacterSummary } from "@/types/character";

interface Row {
  characterId: string;
  name: string;
  imageUrl: string | null;
  reason: string;
}

const VISIBILITY_COPY: Record<Visibility, { label: string; hint: string }> = {
  public: { label: "Public", hint: "Shown on your profile. Anyone can read it and report it." },
  private: { label: "Private", hint: "Only you can see it. You can make it public later." },
};

export function ListBuilder({ lists }: { lists: UserList[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready =
    title.trim().length >= TITLE_MIN && rows.length > 0 && rows.every((row) => row.reason.trim().length >= REASON_MIN);

  function startNew() {
    setEditing("new");
    setTitle("");
    setVisibility("public");
    setRows([]);
    setError(null);
  }

  function startEdit(list: UserList) {
    setEditing(list.id);
    setTitle(list.title);
    setVisibility(list.visibility);
    setRows(
      list.items.map((item) => ({
        characterId: item.characterId,
        name: item.name,
        imageUrl: item.imageUrl,
        reason: item.reason,
      })),
    );
    setError(null);
  }

  function add(character: CharacterSummary) {
    setRows((current) =>
      current.length >= MAX_ITEMS || current.some((row) => row.characterId === character.id)
        ? current
        : [...current, { characterId: character.id, name: character.name, imageUrl: character.imageUrl, reason: "" }],
    );
  }

  function setReason(index: number, reason: string) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, reason } : row)));
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
    setRows((current) => current.filter((_, i) => i !== index));
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
      visibility,
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
    <div className="space-y-6">
      <p className="eyebrow">
        {lists.length} of {MAX_LISTS} lists
      </p>

      {editing === null ? (
        <>
          {lists.length > 0 ? (
            <ul className="space-y-3">
              {lists.map((list) => (
                <li key={list.id} className="border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-lg font-semibold">{list.title}</p>
                      <p className="eyebrow mt-1">
                        {VISIBILITY_COPY[list.visibility].label} / {list.items.length}{" "}
                        {list.items.length === 1 ? "entry" : "entries"}
                      </p>
                      {list.status === "hidden" ? (
                        <p className="mt-2 text-sm font-medium">
                          Hidden by a moderator. It is not shown on your profile.
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-line btn-sm" onClick={() => startEdit(list)} disabled={busy}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-quiet btn-sm" onClick={() => void remove(list.id)} disabled={busy}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <ul className="mt-3 flex gap-1.5">
                    {list.items.slice(0, 6).map((item) => (
                      <li key={item.characterId}>
                        <Portrait name={item.name} src={item.imageUrl} sizes="40px" className="aspect-2/3 w-8 border" />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border p-4 text-sm text-muted-foreground">No lists yet. Start one: your top five of a verse, or a pick of underrated characters.</p>
          )}

          <button type="button" className="btn btn-solid" onClick={startNew} disabled={lists.length >= MAX_LISTS}>
            {lists.length >= MAX_LISTS ? `Limit of ${MAX_LISTS} lists reached` : "New list"}
          </button>
        </>
      ) : (
        <form onSubmit={save} className="space-y-6">
          <label className="block text-sm">
            <span className="eyebrow mb-1 flex justify-between">
              <span>Title</span>
              <span className="tabular">
                {title.length} / {TITLE_MAX}
              </span>
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={TITLE_MAX}
              placeholder="Top 5 speedsters"
              required
              className={controlClass}
            />
          </label>

          <div>
            <p className="eyebrow mb-2">Who can see it</p>
            <div role="group" aria-label="Who can see this list" className="flex border-b">
              {(["public", "private"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={visibility === key}
                  onClick={() => setVisibility(key)}
                  className={cn(
                    "h-10 border-b-2 border-transparent px-4 text-sm font-medium transition-colors hover:bg-muted",
                    visibility === key && "border-b-accent",
                  )}
                >
                  {VISIBILITY_COPY[key].label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{VISIBILITY_COPY[visibility].hint}</p>
          </div>

          <div>
            <p className="eyebrow mb-2">
              Your ranking / {rows.length} of {MAX_ITEMS}
            </p>
            {rows.length === 0 ? (
              <p className="border p-4 text-sm text-muted-foreground">Nothing here yet. Add your first character below.</p>
            ) : (
              <ol className="space-y-3">
                {rows.map((row, index) => (
                  <li key={row.characterId} className="grid grid-cols-[2.5rem_1fr] border">
                    <span className="tabular grid place-items-center border-r bg-muted font-display text-lg font-semibold">
                      {index + 1}
                    </span>
                    <div className="flex gap-3 p-3">
                      <Portrait name={row.name} src={row.imageUrl} sizes="48px" className="aspect-2/3 w-12 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="truncate font-display text-base font-semibold">{row.name}</p>
                        <input
                          value={row.reason}
                          onChange={(event) => setReason(index, event.target.value)}
                          maxLength={REASON_MAX}
                          placeholder="Why this character is here"
                          aria-label={`Reason for ${row.name}`}
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
                          <button type="button" className="btn btn-quiet btn-sm" onClick={() => removeRow(index)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <CharacterFinder
            label={`Add a character (${rows.length} of ${MAX_ITEMS})`}
            onPick={add}
            isDisabled={(c) => rows.length >= MAX_ITEMS || rows.some((row) => row.characterId === c.id)}
          />

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