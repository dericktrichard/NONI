import { Badge } from "@/components/ui/badge";
import type { Tier } from "@/types/character";

export function TierBadge({ tier }: { tier: Tier }) {
  const variant = tier === "S+" ? "accent" : tier === "S" ? "outline" : "default";
  return <Badge variant={variant}>{tier}</Badge>;
}