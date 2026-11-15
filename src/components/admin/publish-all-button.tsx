"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PublishAllButton({ count }: { count: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
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
        setConfirming(false);
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
        confirming ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1">
              Publish {count} drafts without verified feats? They rank on the editor
              baseline and are labelled as estimates.
            </p>
            <Button variant="primary" disabled={busy} onClick={() => void run()}>
              {busy ? "Publishing" : "Confirm"}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{count} drafts waiting.</p>
            <Button variant="outline" onClick={() => setConfirming(true)}>
              Publish all drafts
            </Button>
          </div>
        )
      ) : null}
      {message ? (
        <p role="status" className="mt-2">
          {message}
        </p>
      ) : null}
    </div>
  );
}
