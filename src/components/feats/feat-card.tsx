"use client";

import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PROOF_TYPE_LABELS, claimLabel } from "@/lib/feats/labels";
import { parseProofUrl } from "@/lib/ranking/proof";
import type { VoteValue } from "@/lib/ranking/vote";
import { cn } from "@/lib/utils";
import type { FeatView } from "@/types/character-page";
import type { Proof } from "@/types/domain";
import { ReportButton } from "@/components/feats/report-button";

const voteButton =
  "grid size-11 place-items-center border border-transparent transition-colors hover:bg-muted disabled:opacity-40";

export function ProofItem({ proof }: { proof: Proof }) {
  const url = parseProofUrl(proof.url);
  const label = `${PROOF_TYPE_LABELS[proof.type]}, ${proof.locator}`;

  return (
    <li className="text-sm">
      {url ? (
        <a
          href={url.href}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          className="inline-flex flex-wrap items-center gap-x-2 underline underline-offset-4"
        >
          {label}
          <span className="eyebrow no-underline">{url.hostname}</span>
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : (
        <span>{label}</span>
      )}
      {proof.excerpt ? <blockquote className="mt-1 border-l-2 pl-3 text-foreground/70">{proof.excerpt}</blockquote> : null}
    </li>
  );
}

interface FeatCardProps {
  feat: FeatView;
  mine: VoteValue;
  busy: boolean;
  characterId: string;
  onVote: (value: 1 | -1) => void;
}

export function FeatCard({ feat, characterId, mine, busy, onVote }: FeatCardProps) {
  const verified = feat.status === "verified";
  const primary = feat.proofs.filter((proof) => proof.source !== "secondary");
  const secondary = feat.proofs.filter((proof) => proof.source === "secondary");

  return (
    <li className="flex gap-4 border-b py-6">
      <div className="flex w-11 shrink-0 flex-col items-center">
        <button
          type="button"
          aria-label="Upvote"
          aria-pressed={mine === 1}
          disabled={busy}
          onClick={() => onVote(1)}
          className={cn(voteButton, mine === 1 && "bg-accent text-accent-foreground")}
        >
          <ChevronUp className="size-5" aria-hidden />
        </button>
        <span className="tabular py-1 text-sm font-semibold">{feat.upvotes - feat.downvotes}</span>
        <button
          type="button"
          aria-label="Downvote"
          aria-pressed={mine === -1}
          disabled={busy}
          onClick={() => onVote(-1)}
          className={cn(voteButton, mine === -1 && "bg-foreground text-background")}
        >
          <ChevronDown className="size-5" aria-hidden />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Badge variant={verified ? "accent" : "outline"}>{verified ? "Verified" : "Pending"}</Badge>
          <span className="eyebrow">{claimLabel(feat.claim)}</span>
        </div>
        <h3 className="mt-2 font-display text-lg leading-snug font-semibold">{feat.title}</h3>
        <p className="mt-1 text-sm whitespace-pre-line text-foreground/80">{feat.description}</p>

        <ul className="mt-3 space-y-2">
          {primary.map((proof, index) => (
            <ProofItem key={index} proof={proof} />
          ))}
        </ul>

        {secondary.length > 0 ? (
          <div className="mt-3">
            <p className="eyebrow">Secondary references</p>
            <ul className="mt-1 space-y-2">
              {secondary.map((proof, index) => (
                <ProofItem key={index} proof={proof} />
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="eyebrow">
            {feat.authorName} / {feat.createdAt.slice(0, 10)}
          </p>
          <ReportButton characterId={characterId} featId={feat.id} />
        </div>
      </div>
    </li>
  );
}