import type { CharacterSeed } from "@/lib/ranking/character-doc";

/** Placeholder second versions so the versions strip and search grouping can be tried */
export const VERSION_SEEDS: CharacterSeed[] = [
  {
    profile: {
      slug: "superman-live-action",
      name: "Superman",
      attackPotency: "5-B",
      durability: "5-B",
      speed: "Relativistic+",
      verifiedFeatCount: 40,
    },
    verse: "DC Extended Universe",
    media: "live-action",
    featCount: 62,
    entity: "superman",
    continuity: "DCEU",
  },
  {
    profile: {
      slug: "thor-mcu",
      name: "Thor",
      attackPotency: "6-A",
      durability: "6-A",
      speed: "Relativistic",
      verifiedFeatCount: 60,
    },
    verse: "Marvel Cinematic Universe",
    media: "live-action",
    featCount: 90,
    entity: "thor",
    continuity: "MCU",
  },
];
