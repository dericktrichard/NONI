"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SectionLabel } from "@/components/profile/section-label";
import { controlClass } from "@/components/ui/fields";
import { Modal } from "@/components/ui/modal";

export function DeleteCharacter({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
    <section id="danger" className="mt-12" aria-label="Danger zone">
      <SectionLabel title="Danger zone" />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border p-4">
        <p className="max-w-xl text-sm">
          Deleting {name} also deletes all of its feats and votes, every matchup it
          appears in, and any reports about them. It cannot be undone.
        </p>
        <button
          type="button"
          className="btn btn-sm border-(--spark)! bg-(--spark)! text-black!"
          onClick={() => {
            setTyped("");
            setError(null);
            setOpen(true);
          }}
        >
          Delete character
        </button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Character"
        title={`Delete ${name}?`}
      >
        <p className="text-sm">
          This permanently deletes the character, all of its feats and votes, every
          matchup it appears in with its votes and arguments, and any reports about them.
        </p>
        <label className="mt-5 block">
          <span className="eyebrow">
            Type <span className="font-mono normal-case">{slug}</span> to confirm
          </span>
          <input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className={controlClass}
          />
        </label>
        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-sm border-(--spark)! bg-(--spark)! text-black! disabled:opacity-50"
            disabled={busy || typed.trim().toLowerCase() !== slug}
            onClick={() => void remove()}
          >
            {busy ? "Deleting" : "Delete permanently"}
          </button>
          <button
            type="button"
            className="btn btn-line btn-sm"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </section>
  );
}
