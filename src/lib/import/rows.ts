import { z } from "zod";
import { isApTier, isSpeedLevel } from "@/config/scales";
import { SLUG_RE } from "@/lib/firebase/paths";
import { slugify } from "@/lib/slug";
import { createCharacterSchema } from "@/lib/validation/character";

export const IMPORT = { maxRows: 200, maxBytes: 400_000 } as const;

const lead = z
  .object({
    source: z.string().trim().min(1).max(80),
    url: z
      .string()
      .max(300)
      .regex(/^https:\/\//)
      .optional(),
  })
  .strict();

/** The character form's fields, without images. Lists may be left out. `lead` says where the baseline came from. */
export const importRowSchema = createCharacterSchema
  .omit({ imageUrl: true, imageCredit: true })
  .partial({ aliases: true, tags: true, hax: true, resistances: true })
  .extend({ lead: lead.optional() })
  .strict();

export type ImportRow = z.infer<typeof importRowSchema>;

export const importFileSchema = z
  .object({ characters: z.array(importRowSchema).min(1).max(IMPORT.maxRows) })
  .strict();

export type ParseResult = { ok: true; rows: ImportRow[] } | { ok: false; error: string };

export function parseImport(text: string): ParseResult {
  if (text.length > IMPORT.maxBytes)
    return { ok: false, error: "The file is too large." };

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "That is not valid JSON." };
  }

  const parsed = importFileSchema.safeParse(json);
  if (parsed.success) return { ok: true, rows: parsed.data.characters };

  const issue = parsed.error.issues[0]!;
  const [root, index, ...rest] = issue.path;
  const where =
    root === "characters" && typeof index === "number"
      ? `Row ${index + 1}${rest.length > 0 ? `, ${rest.map(String).join(".")}` : ""}`
      : "File";
  return { ok: false, error: `${where}: ${issue.message}` };
}

export type ReadyRow = Required<
  Pick<ImportRow, "slug" | "aliases" | "tags" | "hax" | "resistances">
> &
  Omit<ImportRow, "slug" | "aliases" | "tags" | "hax" | "resistances">;

/** A row with an entity is a version, so its slug carries the continuity or medium */
export function rowSlug(row: ImportRow): string {
  if (row.slug) return row.slug;
  const label = row.entity ? (row.continuity ?? row.media) : "";
  return slugify(label ? `${row.name} ${label}` : row.name);
}

export type RowStatus = "new" | "exists" | "invalid";

export interface PlannedRow {
  index: number;
  slug: string;
  name: string;
  status: RowStatus;
  reason: string | null;
}

export interface ImportPlan {
  items: PlannedRow[];
  ready: ReadyRow[];
}

function scaleIssue(row: ImportRow): string | null {
  const powers = [...(row.hax ?? []), ...(row.resistances ?? [])].map((a) => a.power);
  const bad =
    !isApTier(row.attackPotency) ||
    !isApTier(row.durability) ||
    !isSpeedLevel(row.speed) ||
    powers.some((power) => !isApTier(power));
  return bad ? "Values must come from the scales." : null;
}

/** Decides what each row would do. Pure: the caller supplies the slugs already stored. */
export function planImport(
  rows: readonly ImportRow[],
  existing: ReadonlySet<string>,
): ImportPlan {
  const slugs = new Set<string>();
  const versions = new Set<string>();
  const items: PlannedRow[] = [];
  const ready: ReadyRow[] = [];

  rows.forEach((row, index) => {
    const slug = rowSlug(row);
    const base = { index, slug, name: row.name };
    const reject = (reason: string) => items.push({ ...base, status: "invalid", reason });

    if (!slug || slug.length > 80 || !SLUG_RE.test(slug)) {
      reject("Could not make a valid slug. Set one by hand.");
      return;
    }
    const scales = scaleIssue(row);
    if (scales) {
      reject(scales);
      return;
    }
    if (slugs.has(slug)) {
      reject("Repeated in this file.");
      return;
    }
    const version = `${row.entity ?? slug}|${row.media}|${row.continuity ?? ""}`;
    if (versions.has(version)) {
      reject("Another row is the same version of this character.");
      return;
    }
    slugs.add(slug);
    versions.add(version);

    if (existing.has(slug)) {
      items.push({
        ...base,
        status: "exists",
        reason: "Already in the database, skipped.",
      });
      return;
    }

    items.push({ ...base, status: "new", reason: null });
    ready.push({
      ...row,
      slug,
      aliases: row.aliases ?? [],
      tags: row.tags ?? [],
      hax: row.hax ?? [],
      resistances: row.resistances ?? [],
    });
  });

  return { items, ready };
}
