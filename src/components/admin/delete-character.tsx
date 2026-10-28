"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/fields";

export function DeleteCharacter({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/characters/${slug}/delete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: typed }),
      });
      if (response.ok) {
        router.replace("/admin/characters");
        router.refresh();
        return;
      }
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not delete the character.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-16 max-w-2xl border-t pt-8" aria-labelledby="danger">
      <h2 id="danger" className="eyebrow">
        Delete {name}
      </h2>
      <p className="mt-2 text-sm">
        This permanently deletes the character, all of its feats and votes, every matchup it appears in with its
        votes and arguments, and any reports about them. It cannot be undone.
      </p>
      <label className="mt-4 block">
        <span className="eyebrow">Type {slug} to confirm</span>
        <input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          className={controlClass}
        />
      </label>
      <div className="mt-4">
        <Button variant="outline" disabled={busy || typed !== slug} onClick={() => void remove()}>
          Delete permanently
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium">
          {error}
        </p>
      ) : null}
    </section>
  );
}