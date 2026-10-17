"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HAX_KIND_LIST, HAX_KINDS, type HaxKind } from "@/config/combat";
import { LIMITS } from "@/config/limits";
import { AP_TIERS, MAX_DIMENSION, MIN_DIMENSION, SPEED_LEVELS, dimensionLabel } from "@/config/scales";
import { CATEGORY_LABELS, PROOF_TYPE_LABELS, buildClaim, type Category, type ClaimFields } from "@/lib/feats/labels";
import type { ProofIssue } from "@/lib/ranking/proof";
import type { FeatView } from "@/types/character-page";
import type { Proof, ProofType } from "@/types/domain";

interface ProofRow {
  key: number;
  type: ProofType;
  url: string;
  locator: string;
  excerpt: string;
}

let nextKey = 0;
const blankProof = (): ProofRow => ({ key: nextKey++, type: "panel", url: "", locator: "", excerpt: "" });
const blankClaim: ClaimFields = { category: "attackPotency", tier: "", level: "", dimension: 0, kind: "", power: "" };

const control =
  "h-11 w-full rounded-sm border bg-background px-3 text-sm text-foreground outline-none focus:border-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}

function TierSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={control}>
        <option value="">Select</option>
        {AP_TIERS.map((tier) => (
          <option key={tier.id} value={tier.id}>
            {tier.id} {tier.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

interface FeatFormProps {
  characterId: string;
  onCreated: (feat: FeatView) => void;
  onCancel: () => void;
}

export function FeatForm({ characterId, onCreated, onCancel }: FeatFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [claim, setClaim] = useState<ClaimFields>(blankClaim);
  const [proofs, setProofs] = useState<ProofRow[]>(() => [blankProof()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<ProofIssue[]>([]);

  const patchClaim = (patch: Partial<ClaimFields>) => setClaim((current) => ({ ...current, ...patch }));
  const patchProof = (key: number, patch: Partial<ProofRow>) =>
    setProofs((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const built = buildClaim(claim);
    if (!built) {
      setError("Complete the claim using the scale options.");
      return;
    }

    const payloadProofs: Proof[] = proofs.map((row) => ({
      type: row.type,
      url: row.url.trim(),
      locator: row.locator.trim(),
      ...(row.type === "quote" ? { excerpt: row.excerpt.trim() } : {}),
    }));

    setBusy(true);
    setError(null);
    setIssues([]);
    try {
      const response = await fetch("/api/feats", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          characterId,
          title: title.trim(),
          description: description.trim(),
          claim: built,
          proofs: payloadProofs,
        }),
      });
      const data = ((await response.json().catch(() => null)) ?? {}) as {
        id?: string;
        error?: string;
        issues?: ProofIssue[];
      };

      if (response.status === 201 && data.id) {
        onCreated({
          id: data.id,
          title: title.trim(),
          description: description.trim(),
          claim: built,
          proofs: payloadProofs,
          status: "pending",
          upvotes: 0,
          downvotes: 0,
          authorName: "you",
          createdAt: new Date().toISOString(),
        });
        return;
      }
      if (Array.isArray(data.issues)) setIssues(data.issues);
      setError(data.error ?? "Could not submit the feat.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const featIssues = issues.filter((issue) => issue.index === undefined);

  return (
    <form onSubmit={submit} className="space-y-5 border p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <h3 className="font-display text-xl font-semibold tracking-tight">Submit a feat</h3>
        <button type="button" onClick={onCancel} aria-label="Close form" className="-m-2 p-2 hover:bg-muted">
          <X className="size-5" />
        </button>
      </div>

      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={LIMITS.featTitle}
          required
          className={control}
        />
      </Field>

      <Field label="What happens, in your own words">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={LIMITS.featDescription}
          required
          rows={4}
          className={`${control} h-auto py-2`}
        />
      </Field>

      <fieldset className="space-y-4">
        <legend className="eyebrow mb-2">What it shows</legend>
        <Field label="Category">
          <select
            value={claim.category}
            onChange={(e) => patchClaim({ category: e.target.value as Category })}
            className={control}
          >
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </Field>

        {(claim.category === "attackPotency" || claim.category === "durability") && (
          <TierSelect label="Tier" value={claim.tier} onChange={(tier) => patchClaim({ tier })} />
        )}

        {claim.category === "speed" && (
          <Field label="Speed level">
            <select value={claim.level} onChange={(e) => patchClaim({ level: e.target.value })} className={control}>
              <option value="">Select</option>
              {SPEED_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </Field>
        )}

        {claim.category === "dimension" && (
          <Field label="Dimensionality">
            <select
              value={claim.dimension}
              onChange={(e) => patchClaim({ dimension: Number(e.target.value) })}
              className={control}
            >
              <option value={0}>Select</option>
              {Array.from({ length: MAX_DIMENSION - MIN_DIMENSION + 1 }, (_, i) => MIN_DIMENSION + i).map((n) => (
                <option key={n} value={n}>
                  {dimensionLabel(n)}
                </option>
              ))}
            </select>
          </Field>
        )}

        {(claim.category === "hax" || claim.category === "resistance") && (
          <>
            <Field label="Kind">
              <select
                value={claim.kind}
                onChange={(e) => patchClaim({ kind: e.target.value as HaxKind | "" })}
                className={control}
              >
                <option value="">Select</option>
                {HAX_KIND_LIST.map((kind) => (
                  <option key={kind} value={kind}>
                    {HAX_KINDS[kind].label}
                  </option>
                ))}
              </select>
            </Field>
            <TierSelect label="Power level" value={claim.power} onChange={(power) => patchClaim({ power })} />
          </>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="eyebrow mb-2">Proof from the source material</legend>
        {featIssues.map((issue) => (
          <p key={issue.code} role="alert" className="text-sm font-medium">
            {issue.message}
          </p>
        ))}

        {proofs.map((row, index) => (
          <div key={row.key} className="space-y-3 border p-3">
            <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
              <Field label="Type">
                <select
                  value={row.type}
                  onChange={(e) => patchProof(row.key, { type: e.target.value as ProofType })}
                  className={control}
                >
                  {(Object.keys(PROOF_TYPE_LABELS) as ProofType[]).map((type) => (
                    <option key={type} value={type}>
                      {PROOF_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Link (https)">
                <input
                  type="url"
                  inputMode="url"
                  value={row.url}
                  onChange={(e) => patchProof(row.key, { url: e.target.value })}
                  maxLength={2048}
                  required
                  className={control}
                />
              </Field>
            </div>

            <Field label={row.type === "video" ? "Timestamp, such as 12:45" : "Chapter and page, such as Ch. 12 p. 4"}>
              <input
                value={row.locator}
                onChange={(e) => patchProof(row.key, { locator: e.target.value })}
                maxLength={LIMITS.proofLocator}
                required
                className={control}
              />
            </Field>

            {row.type === "quote" && (
              <Field label="Quoted text">
                <textarea
                  value={row.excerpt}
                  onChange={(e) => patchProof(row.key, { excerpt: e.target.value })}
                  maxLength={LIMITS.proofExcerpt}
                  rows={3}
                  className={`${control} h-auto py-2`}
                />
              </Field>
            )}

            {issues
              .filter((issue) => issue.index === index)
              .map((issue) => (
                <p key={issue.code} role="alert" className="text-sm font-medium">
                  {issue.message}
                </p>
              ))}

            {proofs.length > 1 && (
              <button
                type="button"
                onClick={() => setProofs((rows) => rows.filter((r) => r.key !== row.key))}
                className="text-sm underline underline-offset-4"
              >
                Remove this proof
              </button>
            )}
          </div>
        ))}

        {proofs.length < LIMITS.proofsPerFeat && (
          <Button variant="outline" size="sm" onClick={() => setProofs((rows) => [...rows, blankProof()])}>
            <Plus className="size-4" aria-hidden />
            Add proof
          </Button>
        )}
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Submit feat
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}