"use client";

import { useState } from "react";
import { controlClass } from "@/components/ui/fields";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import {
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  type ReportReason,
} from "@/lib/moderation/actions";

interface ReportButtonProps {
  endpoint: string;
  target: Record<string, string>;
}

export function ReportButton({ endpoint, target }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("inaccurate");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...target, reason, note: note.trim() || undefined }),
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event(OPEN_SIGN_IN));
        setMessage("Sign in to report.");
        return;
      }
      if (response.ok) {
        setOpen(false);
        setNote("");
        setMessage("Thanks. A moderator will review it.");
        return;
      }
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error ?? "Could not send the report.");
    } catch {
      setMessage("Could not send the report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-sm">
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setMessage(null);
          }}
          className="eyebrow hover:text-foreground min-h-11 underline underline-offset-4 transition-colors"
        >
          Report
        </button>
      ) : (
        <form onSubmit={submit} className="mt-2 w-full max-w-sm space-y-3 border p-3">
          <label className="block">
            <span className="eyebrow mb-1 block">Reason</span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as ReportReason)}
              className={controlClass}
            >
              {REPORT_REASONS.map((value) => (
                <option key={value} value={value}>
                  {REPORT_REASON_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="eyebrow mb-1 block">Details (optional)</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={300}
              rows={3}
              className={`${controlClass} h-auto py-2`}
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn btn-solid btn-sm">
              Send report
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-quiet btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {message ? (
        <p role="status" className="text-muted-foreground mt-1">
          {message}
        </p>
      ) : null}
    </div>
  );
}
