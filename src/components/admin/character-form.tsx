"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Portrait } from "@/components/characters/portrait";
import { SaveBar } from "@/components/admin/save-bar";
import { SectionLabel } from "@/components/profile/section-label";
import { Field, TierSelect, controlClass } from "@/components/ui/fields";
import { HAX_KIND_LIST, HAX_KINDS, type HaxKind } from "@/config/combat";
import { MEDIA_LABELS, MEDIA_TYPES } from "@/config/media";
import {
  MAX_DIMENSION,
  MIN_DIMENSION,
  SPEED_LEVELS,
  dimensionLabel,
} from "@/config/scales";
import type { HaxClaim } from "@/lib/ranking/profile";
import { slugify } from "@/lib/slug";
import type { CharacterEditData } from "@/types/admin-character";
import type { MediaType } from "@/types/character";

interface AbilityRow {
  key: number;
  kind: HaxKind | "";
  power: string;
}

let nextKey = 0;
const blankRow = (): AbilityRow => ({ key: nextKey++, kind: "", power: "" });
const toRow = (claim: HaxClaim): AbilityRow => ({
  key: nextKey++,
  kind: claim.kind,
  power: claim.power,
});
const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function AbilityEditor({
  title,
  rows,
  onChange,
}: {
  title: string;
  rows: AbilityRow[];
  onChange: (rows: AbilityRow[]) => void;
}) {
  const patch = (key: number, change: Partial<AbilityRow>) =>
    onChange(rows.map((row) => (row.key === key ? { ...row, ...change } : row)));

  return (
    <section aria-label={title} className="space-y-3">
      <SectionLabel title={title} />
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">None added.</p>
      ) : null}
      {rows.map((row) => (
        <div
          key={row.key}
          className="grid gap-3 border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <Field label="Kind">
            <select
              value={row.kind}
              onChange={(e) => patch(row.key, { kind: e.target.value as HaxKind | "" })}
              className={controlClass}
            >
              <option value="">Select</option>
              {HAX_KIND_LIST.map((kind) => (
                <option key={kind} value={kind}>
                  {HAX_KINDS[kind].label}
                </option>
              ))}
            </select>
          </Field>
          <TierSelect
            label="Power level"
            value={row.power}
            onChange={(power) => patch(row.key, { power })}
          />
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-line btn-sm"
        onClick={() => onChange([...rows, blankRow()])}
      >
        <Plus className="size-4" aria-hidden />
        Add
      </button>
    </section>
  );
}

export function CharacterForm({ initial }: { initial?: CharacterEditData }) {
  const editing = initial !== undefined;

  const [name, setName] = useState(initial?.name ?? "");
  const [slugText, setSlugText] = useState(initial?.slug ?? "");
  const [verse, setVerse] = useState(initial?.verse ?? "");
  const [media, setMedia] = useState<MediaType>(initial?.media ?? MEDIA_TYPES[0]);
  const [entity, setEntity] = useState(
    initial?.entity && initial.entity !== initial.slug ? initial.entity : "",
  );
  const [continuity, setContinuity] = useState(initial?.continuity ?? "");
  const [aliases, setAliases] = useState(initial?.aliases.join(", ") ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [attackPotency, setAttackPotency] = useState(initial?.attackPotency ?? "");
  const [durability, setDurability] = useState(initial?.durability ?? "");
  const [speed, setSpeed] = useState(initial?.speed ?? "");
  const [dimension, setDimension] = useState(initial?.dimension ?? 0);
  const [hax, setHax] = useState<AbilityRow[]>(() => (initial?.hax ?? []).map(toRow));
  const [resistances, setResistances] = useState<AbilityRow[]>(() =>
    (initial?.resistances ?? []).map(toRow),
  );
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [credit, setCredit] = useState(initial?.imageCredit ?? "");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const slug = initial?.slug ?? (slugText.trim() || slugify(name));

  async function upload(file: File) {
    if (!slug) {
      setError("Enter the name first.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be under 4 MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.set("slug", slug);
      data.set("file", file);
      const response = await fetch("/api/admin/images", { method: "POST", body: data });
      const json = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (response.ok && json?.url) setImageUrl(json.url);
      else setError(json?.error ?? "Upload failed.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const incomplete = [...hax, ...resistances].some(
      (row) => (row.kind === "") !== (row.power === ""),
    );
    if (incomplete) {
      setError("Finish or remove the incomplete ability rows.");
      return;
    }
    const toAbilities = (rows: AbilityRow[]) =>
      rows
        .filter((row) => row.kind !== "")
        .map((row) => ({ kind: row.kind, power: row.power }));

    const entityKey = slugify(entity.trim());
    if (entity.trim() && !entityKey) {
      setError("The main character needs letters or numbers, like superman.");
      return;
    }

    const fields = {
      name: name.trim(),
      verse: verse.trim(),
      media,
      ...(editing
        ? { entity: entityKey || slug }
        : entityKey
          ? { entity: entityKey }
          : {}),
      continuity: continuity.trim() || null,
      aliases: splitList(aliases),
      tags: splitList(tags),
      attackPotency,
      durability,
      speed,
      ...(dimension > 0 ? { dimension } : {}),
      hax: toAbilities(hax),
      resistances: toAbilities(resistances),
      imageUrl,
      imageCredit: imageUrl && credit.trim() ? credit.trim() : null,
    };

    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch(
        editing ? `/api/admin/characters/${initial.slug}` : "/api/admin/characters",
        {
          method: editing ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            editing ? fields : { slug: slugText.trim() || undefined, ...fields },
          ),
        },
      );
      const json = (await response.json().catch(() => null)) as {
        id?: string;
        error?: string;
      } | null;

      if (editing && response.ok) {
        setSaved(true);
      } else if (!editing && response.status === 201 && json?.id) {
        setCreated(json.id);
      } else {
        setError(json?.error ?? "Could not save the character.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="border p-6">
        <p className="font-display text-xl font-semibold">Character created.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/characters/${created}`} className="btn btn-line btn-sm">
            View the page
          </Link>
          <a href="/admin/characters/new" className="btn btn-solid btn-sm">
            Add another
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-1">
          <section aria-label="Identity" className="space-y-4">
            <SectionLabel title="Identity" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  required
                  className={controlClass}
                />
              </Field>
              <Field label={editing ? "Slug (fixed once created)" : "Slug (optional)"}>
                <input
                  value={slugText}
                  onChange={(e) => setSlugText(e.target.value)}
                  placeholder={slugify(name)}
                  maxLength={80}
                  readOnly={editing}
                  className={controlClass}
                />
              </Field>
              <Field label="Verse or franchise">
                <input
                  value={verse}
                  onChange={(e) => setVerse(e.target.value)}
                  maxLength={80}
                  required
                  className={controlClass}
                />
              </Field>
              <Field label="Medium">
                <select
                  value={media}
                  onChange={(e) => setMedia(e.target.value as MediaType)}
                  className={controlClass}
                >
                  {MEDIA_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {MEDIA_LABELS[type]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Version of (slug of the main character)">
                <input
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  maxLength={80}
                  placeholder="superman"
                  className={controlClass}
                />
              </Field>
              <Field label="Version label">
                <input
                  value={continuity}
                  onChange={(e) => setContinuity(e.target.value)}
                  maxLength={40}
                  placeholder="DCEU"
                  className={controlClass}
                />
              </Field>
            </div>
            <p className="text-muted-foreground text-sm">
              Use the version fields when the same character exists in another medium or
              continuity. Give every version the same &quot;Version of&quot; slug. Each
              version keeps its own feats and ranking.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Aliases (comma separated)">
                <input
                  value={aliases}
                  onChange={(e) => setAliases(e.target.value)}
                  className={controlClass}
                />
              </Field>
              <Field label="Tags (comma separated)">
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className={controlClass}
                />
              </Field>
            </div>
          </section>

          <section aria-label="Baseline power" className="space-y-4">
            <SectionLabel title="Baseline power" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TierSelect
                label="Attack potency"
                value={attackPotency}
                onChange={setAttackPotency}
              />
              <TierSelect label="Durability" value={durability} onChange={setDurability} />
              <Field label="Speed">
                <select
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  required
                  className={controlClass}
                >
                  <option value="">Select</option>
                  {SPEED_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Dimensionality">
                <select
                  value={dimension}
                  onChange={(e) => setDimension(Number(e.target.value))}
                  className={controlClass}
                >
                  <option value={0}>Automatic from the tiers</option>
                  {Array.from(
                    { length: MAX_DIMENSION - MIN_DIMENSION + 1 },
                    (_, i) => MIN_DIMENSION + i,
                  ).map((n) => (
                    <option key={n} value={n}>
                      {dimensionLabel(n)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {editing ? (
              <p className="text-muted-foreground text-sm">
                This is the starting baseline. Verified feats override it automatically on
                the live profile.
              </p>
            ) : null}
          </section>

          <AbilityEditor title="Abilities" rows={hax} onChange={setHax} />
          <AbilityEditor title="Resistances" rows={resistances} onChange={setResistances} />
        </div>

        <aside
          aria-label="Image"
          className="space-y-4 lg:sticky lg:top-[calc(var(--nav-space)+1rem)] lg:col-start-2 lg:row-start-1 lg:self-start"
        >
          <SectionLabel title="Image" />
          <Portrait
            name={name || "Preview"}
            src={imageUrl}
            sizes="272px"
            className="aspect-4/5 w-full max-w-60"
          />
          <Field label="JPEG, PNG or WebP, up to 4 MB">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
              className="file:bg-muted block w-full text-sm file:mr-3 file:border file:px-3 file:py-2"
            />
          </Field>
          {uploading ? <p className="eyebrow">Uploading</p> : null}
          <Field label="Credit and source">
            <input
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              maxLength={200}
              className={controlClass}
            />
          </Field>
          {imageUrl ? (
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={() => setImageUrl(null)}
            >
              Remove image
            </button>
          ) : null}
        </aside>
      </div>

      <SaveBar>
        <button
          type="submit"
          className="btn btn-solid btn-sm"
          disabled={busy || uploading}
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {editing ? "Save changes" : "Create character"}
        </button>
        {saved ? (
          <p role="status" className="text-sm">
            Saved.{" "}
            <Link href={`/characters/${slug}`} className="underline underline-offset-4">
              View the page
            </Link>
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm font-medium">
            {error}
          </p>
        ) : null}
      </SaveBar>
    </form>
  );
}
