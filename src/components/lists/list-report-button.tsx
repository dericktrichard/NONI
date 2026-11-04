"use client";

import { useState } from "react";
import { controlClass } from "@/components/ui/fields";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { LIST_REPORT_LABELS, LIST_REPORT_REASONS } from "@/lib/lists/moderation";

const plainButton = "min-h-11 border px-4 text-sm hover:bg-foreground/5 disabled:opacity-50";

export function ListReportButton({ listId }: { listId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (reason === "") return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/lists/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listId, reason, note: note.trim() }),
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event(OPEN_SIGN_IN));
        setError("Sign in to report.");
        return;
      }
      if (response.ok) {
        setDone(true);
        return;
      }
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not send the report.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p role="status" className="text-sm">Thanks. A moderator will review it.</p>;

  if (!open) {
    return (
      <button type="button" className="min-h-11 text-sm underline underline-offset-4" onClick={() => setOpen(true)}>
        Report
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-3 border p-3">
      <select
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        aria-label="Reason"
        required
        className={controlClass}
      >
        <option value="">Choose a reason</option>
        {LIST_REPORT_REASONS.map((value) => (
          <option key={value} value={value}>
            {LIST_REPORT_LABELS[value]}
          </option>
        ))}
      </select>
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={200}
        placeholder="Details (optional)"
        aria-label="Details"
        className={controlClass}
      />
      <div className="flex gap-2">
        <button type="submit" className={plainButton} disabled={busy || reason === ""}>
          Send report
        </button>
        <button type="button" className={plainButton} onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}
    </form>
  );
}