"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { controlClass } from "@/components/ui/fields";
import { Modal } from "@/components/ui/modal";
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

const HB =
  "eyebrow border border-foreground bg-foreground px-2 py-1 text-background! hover:opacity-85 disabled:opacity-50";

export function ReportButton({ endpoint, target }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("inaccurate");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const formId = useId();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...target, reason, note: note.trim() || undefined }),
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event(OPEN_SIGN_IN));
        setOpen(false);
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
      setError(data?.error ?? "Could not send the report.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setMessage(null);
          setError(null);
        }}
        className="eyebrow hover:text-foreground min-h-11 underline underline-offset-4 transition-colors"
      >
        Report
      </button>

      {message ? (
        <p role="status" className="text-muted-foreground">
          {message}
        </p>
      ) : null}

      <Modal
        slim
        open={open}
        onClose={() => setOpen(false)}
        title="Report"
        actions={<span ref={setSlot} className="contents" />}
      >
        <form id={formId} onSubmit={submit} className="space-y-4">
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
          {error ? (
            <p role="alert" className="text-sm font-medium">
              {error}
            </p>
          ) : null}
          {slot
            ? createPortal(
                <button type="submit" form={formId} className={HB} disabled={busy}>
                  {busy ? "Sending" : "Send report"}
                </button>,
                slot,
              )
            : null}
        </form>
      </Modal>
    </div>
  );
}
