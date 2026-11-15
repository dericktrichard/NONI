export const PUBLISH = { minVerifiedFeats: 3 } as const;

export type PublishCheck = { ok: true } | { ok: false; reason: string };

/** An imported draft joins the ranking only with enough verified feats, unless an admin forces it */
export function canPublish(verifiedFeats: number, force: boolean): PublishCheck {
  if (force || verifiedFeats >= PUBLISH.minVerifiedFeats) return { ok: true };
  return {
    ok: false,
    reason: `It needs ${PUBLISH.minVerifiedFeats} verified feats before it can be ranked. It has ${verifiedFeats}.`,
  };
}
