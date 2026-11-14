"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfileAvatar } from "@/components/profile/banner";
import { useSession } from "@/hooks/use-session";
import { postJson } from "@/lib/battle/client";
import type { FlairState } from "@/lib/data/flair";
import { FRAMES, TITLES, type FlairKind } from "@/lib/flair/rules";
import type { Look } from "@/lib/profile/look";

export function FlairShop({ look }: { look: Look }) {
  const router = useRouter();
  const { state } = useSession();
  const handle = (state.status === "ready" && state.user?.handle) || "you";
  const [flair, setFlair] = useState<FlairState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void postJson<FlairState>("/api/flair", { op: "state" }).then((reply) => {
      if (!live) return;
      if (reply.ok) setFlair(reply.data);
      else setError(reply.error);
    });
    return () => {
      live = false;
    };
  }, []);

  async function run(body: object) {
    setBusy(true);
    setError(null);
    const reply = await postJson<FlairState>("/api/flair", body);
    if (reply.ok) {
      setFlair(reply.data);
      router.refresh();
    } else {
      setError(reply.error);
    }
    setBusy(false);
  }

  function status(id: string, price: number, kind: FlairKind): string {
    if (!flair) return "";
    if ((kind === "frame" ? flair.frame : flair.title) === id) return "Equipped";
    return flair.owned.includes(id) ? "Owned" : `${price} Glaze`;
  }

  function action(id: string, price: number, kind: FlairKind) {
    if (!flair) return null;
    const equipped = (kind === "frame" ? flair.frame : flair.title) === id;
    const owned = flair.owned.includes(id);

    if (equipped)
      return (
        <button
          type="button"
          className="btn btn-line btn-sm w-full"
          disabled={busy}
          onClick={() => void run({ op: "clear", kind })}
        >
          Unequip
        </button>
      );
    if (owned)
      return (
        <button
          type="button"
          className="btn btn-solid btn-sm w-full"
          disabled={busy}
          onClick={() => void run({ op: "equip", id })}
        >
          Equip
        </button>
      );
    return (
      <button
        type="button"
        className="btn btn-line btn-sm w-full"
        disabled={busy || price > flair.balance}
        onClick={() => void run({ op: "buy", id })}
      >
        Buy for {price}
      </button>
    );
  }

  return (
    <div>
      <p className="text-muted-foreground text-sm">
        Flair is cosmetic. It never changes a ranking, and purchases are permanent and not
        refundable. Bought Glaze is spent first.
      </p>
      <p className="tabular mt-3 text-sm font-medium">
        {flair ? `Balance ${flair.balance.toLocaleString("en-US")} Glaze` : "Loading..."}
      </p>
      {error ? (
        <p role="alert" className="mt-3 border p-2 text-sm">
          {error}
        </p>
      ) : null}

      <h3 className="eyebrow mt-6">Avatar frames</h3>
      <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FRAMES.map((item) => (
          <li key={item.id} className="border p-3 text-center">
            <ProfileAvatar
              look={{ ...look, frame: item.id }}
              handle={handle}
              className="mx-auto size-16"
            />
            <p className="mt-2 text-sm font-medium">{item.label}</p>
            <p className="eyebrow tabular">{status(item.id, item.price, "frame")}</p>
            <div className="mt-2">{action(item.id, item.price, "frame")}</div>
          </li>
        ))}
      </ul>

      <h3 className="eyebrow mt-6">Title lines</h3>
      <ul className="mt-2 border">
        {TITLES.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="eyebrow tabular block">
                {status(item.id, item.price, "title")}
              </span>
            </span>
            <span className="w-32 shrink-0">{action(item.id, item.price, "title")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
