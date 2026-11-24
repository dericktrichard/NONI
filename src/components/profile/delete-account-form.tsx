"use client";

import { useState } from "react";

interface DeleteAccountFormProps {
  onCancel: () => void;
  onDeleted: () => void;
}

const WORD = "DELETE";

export function DeleteAccountForm({ onCancel, onDeleted }: DeleteAccountFormProps) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (typed !== WORD) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: WORD }),
      });
      if (response.ok) {
        onDeleted();
        return;
      }
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not delete the account.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-3 text-sm">
        <p className="font-medium">This cannot be undone.</p>
        <div className="border">
          <p className="eyebrow border-b p-3">Deleted</p>
          <p className="p-3">
            Your profile, handle, Glaze, lists, favourites, fan points and sign-in.
          </p>
        </div>
        <div className="border">
          <p className="eyebrow border-b p-3">Kept, with no link to you</p>
          <p className="p-3">
            Your feats, arguments and votes stay in the record so rankings do not move.
            They no longer point to any person.
          </p>
        </div>
      </div>

      <label className="block text-sm">
        <span className="eyebrow mb-1 block">Type {WORD} to confirm</span>
        <input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="bg-background focus:border-foreground h-11 w-full border px-3 text-sm outline-none"
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy || typed !== WORD}
          className="btn btn-sm border-(--spark)! bg-(--spark)! text-black! disabled:opacity-50"
        >
          {busy ? "Deleting" : "Delete my account"}
        </button>
        <button
          type="button"
          className="btn btn-line btn-sm"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
