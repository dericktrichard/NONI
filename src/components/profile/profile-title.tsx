import { titleLabel } from "@/lib/flair/rules";
import type { Look } from "@/lib/profile/look";

/** The title line a player has equipped, shown under their handle */
export function ProfileTitle({ look }: { look: Look }) {
  const label = titleLabel(look.title);
  return label ? <p className="eyebrow mt-1">{label}</p> : null;
}
