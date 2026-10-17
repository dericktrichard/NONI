"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { OPEN_SIGN_IN } from "@/lib/auth/events";
import type { VoteValue } from "@/lib/ranking/vote";
import type { FeatView } from "@/types/character-page";
import type { FeatStatus } from "@/types/domain";
import { FeatCard } from "./feat-card";
import { FeatForm } from "./feat-form";

interface VoteResponse {
  error?: string;
  status?: FeatStatus;
  upvotes?: number;
  downvotes?: number;
  value?: VoteValue;
}

export function FeatSection({ characterId, initialFeats }: { characterId: string; initialFeats: FeatView[] }) {
  const { state } = useSession();
  const user = state.status === "ready" ? state.user : null;
  const uid = user?.uid ?? null;

  const [feats, setFeats] = useState(initialFeats);
  const [mine, setMine] = useState<Record<string, VoteValue>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const ids = initialFeats.map((feat) => feat.id).join(",");

  useEffect(() => {
    if (!uid || !ids) return;
    let active = true;
    fetch(`/api/feats/mine?characterId=${characterId}&ids=${ids}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((json: { votes?: Record<string, VoteValue> } | null) => {
        if (active && json?.votes) setMine(json.votes);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [uid, characterId, ids]);

  const myVotes = uid ? mine : {};

  function askToSignIn() {
    window.dispatchEvent(new Event(OPEN_SIGN_IN));
  }

  function openForm() {
    if (!user) return askToSignIn();
    if (!user.verified) {
      setNotice("Verify your email to submit feats, then sign in again.");
      return;
    }
    setNotice(null);
    setFormOpen(true);
  }

  async function vote(feat: FeatView, value: 1 | -1) {
    if (!user) return askToSignIn();
    if (!user.verified) {
      setNotice("Verify your email to vote, then sign in again.");
      return;
    }

    const next: VoteValue = myVotes[feat.id] === value ? 0 : value;
    setBusyId(feat.id);
    setNotice(null);
    try {
      const response = await fetch("/api/feats/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ characterId, featId: feat.id, value: next }),
      });
      const data = (await response.json().catch(() => null)) as VoteResponse | null;

      if (!response.ok || !data || data.status === undefined || data.upvotes === undefined || data.downvotes === undefined) {
        setNotice(data?.error ?? "Could not save the vote.");
        return;
      }

      const { status, upvotes, downvotes } = data;
      setFeats((list) =>
        list.flatMap((item) => {
          if (item.id !== feat.id) return [item];
          return status === "rejected" ? [] : [{ ...item, status, upvotes, downvotes }];
        }),
      );
      setMine((current) => ({ ...current, [feat.id]: data.value ?? 0 }));
    } catch {
      setNotice("Network error. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section aria-labelledby="feats-heading" className="mt-12">
      <div className="flex items-center justify-between gap-4">
        <h2 id="feats-heading" className="eyebrow">
          Feats / {feats.length}
        </h2>
        {!formOpen && (
          <Button variant="primary" size="sm" onClick={openForm}>
            <Plus className="size-4" aria-hidden />
            Submit a feat
          </Button>
        )}
      </div>

      <p aria-live="polite" className="mt-3 min-h-5 text-sm font-medium">
        {notice}
      </p>

      {formOpen && (
        <div className="mt-3">
          <FeatForm
            characterId={characterId}
            onCancel={() => setFormOpen(false)}
            onCreated={(feat) => {
              setFeats((list) => [feat, ...list]);
              setFormOpen(false);
              setNotice("Feat submitted. It is pending until the community votes.");
            }}
          />
        </div>
      )}

      {feats.length === 0 ? (
        <p className="mt-6 border-y py-10 text-center text-muted-foreground">
          No feats yet. Be the first to submit one with proof.
        </p>
      ) : (
        <ul className="mt-2 border-t">
          {feats.map((feat) => (
            <FeatCard
              key={feat.id}
              feat={feat}
              mine={myVotes[feat.id] ?? 0}
              busy={busyId === feat.id}
              onVote={(value) => void vote(feat, value)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}