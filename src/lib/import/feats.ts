import { z } from "zod";
import { isApTier, isSpeedLevel } from "@/config/scales";
import { validateFeatProofs } from "@/lib/ranking/proof";
import { submitFeatSchema, type SubmitFeatInput } from "@/lib/validation/feat";

export const FEAT_IMPORT = { maxRows: 150, maxBytes: 400_000 } as const;

export const featFileSchema = z
  .object({ feats: z.array(submitFeatSchema).min(1).max(FEAT_IMPORT.maxRows) })
  .strict();

export type ParseResult =
  { ok: true; rows: SubmitFeatInput[] } | { ok: false; error: string };

export function parseFeatImport(text: string): ParseResult {
  if (text.length > FEAT_IMPORT.maxBytes)
    return { ok: false, error: "The file is too large." };

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "That is not valid JSON." };
  }

  const parsed = featFileSchema.safeParse(json);
  if (parsed.success) return { ok: true, rows: parsed.data.feats };

  const issue = parsed.error.issues[0]!;
  const [root, index, ...rest] = issue.path;
  const where =
    root === "feats" && typeof index === "number"
      ? `Row ${index + 1}${rest.length > 0 ? `, ${rest.map(String).join(".")}` : ""}`
      : "File";
  return { ok: false, error: `${where}: ${issue.message}` };
}

export type RowStatus = "new" | "exists" | "invalid";

export interface PlannedFeat {
  index: number;
  characterId: string;
  title: string;
  status: RowStatus;
  reason: string | null;
}

export interface FeatPlan {
  items: PlannedFeat[];
  ready: SubmitFeatInput[];
}

export const titleKey = (title: string) => title.trim().toLowerCase();

function claimIssue(claim: SubmitFeatInput["claim"]): string | null {
  switch (claim.category) {
    case "attackPotency":
    case "durability":
      return isApTier(claim.tier) ? null : "The tier is not on the scale.";
    case "speed":
      return isSpeedLevel(claim.level) ? null : "The speed is not on the scale.";
    case "dimension":
      return claim.dimension >= 0 ? null : "The dimension is not valid.";
    default:
      return isApTier(claim.power) ? null : "The power is not on the scale.";
  }
}

/** Decides what each feat would do. Pure: the caller supplies each character's stored titles. */
export function planFeatImport(
  rows: readonly SubmitFeatInput[],
  stored: ReadonlyMap<string, ReadonlySet<string>>,
): FeatPlan {
  const seen = new Set<string>();
  const items: PlannedFeat[] = [];
  const ready: SubmitFeatInput[] = [];

  rows.forEach((row, index) => {
    const base = { index, characterId: row.characterId, title: row.title };
    const reject = (reason: string) => items.push({ ...base, status: "invalid", reason });

    const titles = stored.get(row.characterId);
    if (!titles) return reject("Character not found.");

    const claim = claimIssue(row.claim);
    if (claim) return reject(claim);

    const proof = validateFeatProofs(row.proofs)[0];
    if (proof) return reject(proof.message);

    const key = `${row.characterId}|${titleKey(row.title)}`;
    if (seen.has(key)) return reject("Repeated in this file.");
    seen.add(key);

    if (titles.has(titleKey(row.title))) {
      items.push({
        ...base,
        status: "exists",
        reason: "Already on this character, skipped.",
      });
      return;
    }

    items.push({ ...base, status: "new", reason: null });
    ready.push(row);
  });

  return { items, ready };
}
