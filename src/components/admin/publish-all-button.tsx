"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";

export function PublishAllButton({ count }: { count: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/characters/publish-all", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const json = (await response.json().catch(() => null)) as {
        error?: string;
        published?: number;
      } | null;
      if (response.ok) {
        setOpen(false);
        setMessage(`Published ${json?.published ?? 0} characters.`);
        router.refresh();
        return;
      }
      setMessage(json?.error ?? "Could not publish.");
    } catch {
      setMessage("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (count === 0 && !message) return null;

  return (
    <div className="mt-6 border p-4 text-sm">
      {count > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>{count} drafts waiting.</p>
          <button
            type="button"
            className="btn btn-line btn-sm"
            onClick={() => setOpen(true)}
          >
            Publish all drafts
          </button>
        </div>
      ) : null}
      {message ? (
        <p role="status" className={count > 0 ? "mt-2" : undefined}>
          {message}
        </p>
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Characters"
        title="Publish all drafts?"
      >
        <p className="text-sm">
          Publish {count} drafts without verified feats? They rank on the editor baseline
          and are labelled as estimates.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-solid btn-sm"
            disabled={busy}
            onClick={() => void run()}
          >
            {busy ? "Publishing" : "Publish all"}
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
    </div>
  );
}
