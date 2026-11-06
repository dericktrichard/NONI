"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import { cn } from "@/lib/utils";

interface FavouriteState {
  favourited: boolean;
  fans: number;
}

export function FavouriteButton({ characterId }: { characterId: string }) {
  const { state } = useSession();
  const user = state.status === "ready" ? state.user : null;
  const uid = user?.uid ?? null;

  const [known, setKnown] = useState<FavouriteState | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let live = true;
    fetch(`/api/favourites?characterId=${encodeURIComponent(characterId)}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((json: FavouriteState | null) => {
        if (live && json) setKnown(json);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [uid, characterId]);

  const current = uid ? known : null;
  const favourited = current?.favourited ?? false;

  async function toggle() {
    if (!user) {
      window.dispatchEvent(new Event(OPEN_SIGN_IN));
      return;
    }
    if (!user.verified) {
      setNotice("Verify your email to favourite characters, then sign in again.");
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/favourites", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ characterId, value: !favourited }),
      });
      const data = (await response.json().catch(() => null)) as (Partial<FavouriteState> & { error?: string }) | null;
      if (response.ok && data && typeof data.favourited === "boolean" && typeof data.fans === "number") {
        setKnown({ favourited: data.favourited, fans: data.fans });
      } else {
        setNotice(data?.error ?? "Could not save that.");
      }
    } catch {
      setNotice("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        aria-pressed={favourited}
        className="btn btn-line h-auto w-full gap-2 py-3"
      >
        <Heart className={cn("size-4", favourited && "fill-current")} aria-hidden />
        {favourited ? "Favourited" : "Favourite"}
        {current ? <span className="tabular text-muted-foreground">{current.fans}</span> : null}
      </button>
      {notice ? (
        <p role="status" className="mt-2 text-xs font-medium">
          {notice}
        </p>
      ) : null}
    </div>
  );
}