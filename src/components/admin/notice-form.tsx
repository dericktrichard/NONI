"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NoticePanel } from "@/components/home/notice-panel";
import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/fields";
import { NOTICE_LIMITS } from "@/lib/validation/notice";

interface Initial {
  enabled: boolean;
  title: string;
  body: string;
}

export function NoticeForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/notice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled, title, body }),
      });
      const json = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (response.ok) {
        setMessage(
          enabled
            ? "Saved. The notice is live on the home page."
            : "Saved. The notice is hidden.",
        );
        router.refresh();
        return;
      }
      setMessage(json?.error ?? "Could not save. Check the title and message.");
    } catch {
      setMessage("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4 border p-4">
        <div>
          <p className="text-sm font-medium">Show on the home page</p>
          <p className="text-muted-foreground text-sm">
            Off means nothing appears, as if it was never there.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Show the notice on the home page"
          onClick={() => setEnabled((value) => !value)}
          className={`relative h-7 w-12 shrink-0 border transition-colors ${
            enabled ? "bg-accent border-foreground" : "bg-muted"
          }`}
        >
          <span
            className={`bg-foreground absolute top-0.5 size-5 transition-[left] duration-150 ${
              enabled ? "left-6" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={NOTICE_LIMITS.title}
          className={controlClass}
        />
      </Field>

      <Field label="Message">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={NOTICE_LIMITS.body}
          rows={7}
          className={controlClass}
        />
        <p className="eyebrow mt-1 text-right">
          {body.length} / {NOTICE_LIMITS.body}
        </p>
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={busy} onClick={() => void save()}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Save
        </Button>
        {message ? (
          <p role="status" className="text-sm">
            {message}
          </p>
        ) : null}
      </div>

      <section aria-label="Preview">
        <p className="eyebrow mb-2">Preview</p>
        {enabled && title.trim() && body.trim() ? (
          <NoticePanel title={title.trim()} body={body.trim()} />
        ) : (
          <p className="text-muted-foreground border p-4 text-sm">
            Nothing is shown. Visitors see no notice.
          </p>
        )}
      </section>
    </div>
  );
}
