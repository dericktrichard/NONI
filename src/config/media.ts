import type { MediaType } from "@/types/character";

export const MEDIA_LABELS: Record<MediaType, string> = {
  anime: "Anime",
  manga: "Manga",
  comic: "Comics",
  novel: "Novels",
  manhwa: "Manhwa",
  manhua: "Manhua",
  donghua: "Donghua",
  "live-action": "Live action",
};

export const MEDIA_TYPES = Object.keys(MEDIA_LABELS) as MediaType[];

export function isMediaType(value: unknown): value is MediaType {
  return typeof value === "string" && Object.hasOwn(MEDIA_LABELS, value);
}
