import { Badge } from "@/components/ui/badge";
import { AP_TIERS, TIER_GROUPS } from "@/config/scales";

const BY_ID = new Map(AP_TIERS.map((t) => [t.id, t]));

export function TierBadge({ tier }: { tier: string }) {
  const info = BY_ID.get(tier);
  const group = info?.group ?? 11;
  // A lower group number means a higher tier. Cosmic (3) and above get the accent fill.
  const variant = group <= 3 ? "accent" : group <= 6 ? "outline" : "default";

  return (
    <Badge variant={variant} title={info ? `${info.label} (${TIER_GROUPS[group]})` : tier}>
      {tier}
    </Badge>
  );
}