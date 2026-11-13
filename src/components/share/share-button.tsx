"use client";

import { useState } from "react";

interface ShareButtonProps {
  title: string;
  text: string;
  className?: string;
}

export function ShareButton({ title, text, className }: ShareButtonProps) {
  const [note, setNote] = useState<string | null>(null);

  function flash(message: string) {
    setNote(message);
    setTimeout(() => setNote(null), 2500);
  }

  async function copy(message: string) {
    await navigator.clipboard.writeText(message);
    flash("Copied");
  }

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}`;
    const message = `${text}\n${url}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, text, url });
        return;
      }
      await copy(message);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await copy(message);
      } catch {
        flash("Copy it from your browser");
      }
    }
  }

  return (
    <span className="inline-flex items-center gap-3">
      <button type="button" className={className} onClick={() => void share()}>
        Share
      </button>
      <span role="status" className="eyebrow">
        {note}
      </span>
    </span>
  );
}
