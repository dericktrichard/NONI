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

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash("Link copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        flash("Link copied");
      } catch {
        flash("Copy the address from your browser");
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