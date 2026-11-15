"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const LINK =
  "min-h-11 px-2 py-3 text-sm underline underline-offset-4 disabled:opacity-50";

/** Lives in a wrapping flex row: the button stays inline, a refusal takes its own line */
export function PublishButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [canForce, setCanForce] = useState(false);

  async function publish(force: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/characters/${slug}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const json = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (response.ok) {
        setCanForce(false);
        router.refresh();
        return;
      }
      const error = json?.error ?? "Could not publish.";
      setMessage(error);
      setCanForce(!force && error.startsWith("It needs"));
    } catch {
      setMessage("Network error. Try again.");
      setCanForce(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => void publish(false)}
        className={LINK}
      >
        Publish
      </button>
      {message ? (
        <div role="alert" className="basis-full border p-3 text-sm">
          <p>{message}</p>
          {canForce ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void publish(true)}
              className={`${LINK} mt-1 font-medium`}
            >
              Publish anyway
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
