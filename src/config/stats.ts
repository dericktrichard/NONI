export const STAT_KEYS = [
  "attackPotency",
  "speed",
  "durability",
  "reach",
  "intelligence",
  "stamina",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export const STAT_LABELS: Record<StatKey, string> = {
  attackPotency: "Attack potency",
  speed: "Speed",
  durability: "Durability",
  reach: "Reach",
  intelligence: "Intelligence",
  stamina: "Stamina",
};