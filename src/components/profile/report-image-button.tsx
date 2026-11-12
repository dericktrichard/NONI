"use client";

import { useState } from "react";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import {
  IMAGE_REPORT_LABELS,
  IMAGE_REPORT_REASONS,
  type ImageKind,
  type ImageReportReason,
} from "@/lib/profile/image-moderation";
import { cn } from "@/lib/utils";

interface ReportImageButtonProps {
  uid: string;
  avatar: boolean;
  banner: boolean;
}

const FIELD = "w-full border bg-background px-3 py-2 text-sm";

export function ReportImageButton({ uid, avatar, banner }: ReportImageButtonProps) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ImageKind>(avatar ? "avatar" : "banner");
  const [reason, setReason] = useState<ImageReportReason>("sexual");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ uid, kind, reason, note }),
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

  if (done)
    return (
      <p className="text-muted-foreground mt-4 text-sm">
        Thanks. A moderator will review it.
      </p>
    );

  return (
    <div className="mt-4">
      <button
        type="button"
        className="btn btn-quiet btn-sm"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Report image
      </button>

      {open ? (
        <form
          className="mt-3 max-w-md space-y-3 border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          {avatar && banner ? (
            <div className="flex gap-4">
              {(["avatar", "banner"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={kind === option}
                  onClick={() => setKind(option)}
                  className={cn(
                    "eyebrow border-b-2 border-transparent py-1",
                    kind === option && "border-b-accent",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          <label className="block">
            <span className="eyebrow">Reason</span>
            <select
              className={cn(FIELD, "mt-1")}
              value={reason}
              onChange={(event) => setReason(event.target.value as ImageReportReason)}
            >
              {IMAGE_REPORT_REASONS.map((value) => (
                <option key={value} value={value}>
                  {IMAGE_REPORT_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="eyebrow">Note (optional)</span>
            <input
              className={cn(FIELD, "mt-1")}
              maxLength={200}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>

          {error ? (
            <p role="alert" className="text-sm font-medium">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button type="submit" className="btn btn-solid btn-sm" disabled={busy}>
              Send report
            </button>
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
