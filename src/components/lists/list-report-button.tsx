"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { controlClass } from "@/components/ui/fields";
import { Modal } from "@/components/ui/modal";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { LIST_REPORT_LABELS, LIST_REPORT_REASONS } from "@/lib/lists/moderation";

export function ListReportButton({ listId }: { listId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const formId = useId();

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

  if (done) {
    return (
      <p role="status" className="text-muted-foreground text-sm">
        Thanks. A moderator will review it.
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        className="eyebrow hover:text-foreground min-h-11 underline underline-offset-4 transition-colors"
        onClick={() => setOpen(true)}
      >
        Report
      </button>

      <Modal
        slim
        open={open}
        onClose={() => setOpen(false)}
        title="Report list"
        actions={<span ref={setSlot} className="contents" />}
      >
        <form id={formId} onSubmit={submit} className="space-y-4">
          <label className="block text-sm">
            <span className="eyebrow mb-1 block">Reason</span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
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
          </label>
          <label className="block text-sm">
            <span className="eyebrow mb-1 block">Details (optional)</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={200}
              className={controlClass}
            />
          </label>
          {error ? (
            <p role="alert" className="text-sm font-medium">
              {error}
            </p>
          ) : null}
          {slot
            ? createPortal(
                <button
                  type="submit"
                  form={formId}
                  className="eyebrow border border-foreground bg-foreground px-2 py-1 text-background! hover:opacity-85 disabled:opacity-50"
                  disabled={busy || reason === ""}
                >
                  {busy ? "Sending" : "Send report"}
                </button>,
                slot,
              )
            : null}
        </form>
      </Modal>
    </>
  );
}
