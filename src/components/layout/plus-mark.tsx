"use client";

import { usePlus } from "@/hooks/use-plus";

/** A small italic serif mark beside the wordmark while the signed-in player has NONI Plus */
export function PlusMark() {
  const plus = usePlus();
  if (!plus) return null;

  return (
    <span
      title="NONI Plus"
      className="text-accent-ink -mt-2 text-base leading-none italic"
      style={{ fontFamily: "var(--font-garamond), Georgia, serif" }}
    >
      Plus
    </span>
  );
}
