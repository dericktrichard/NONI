import type { Look } from "@/lib/profile/look";

export type BoardKey = "glaze" | "week" | "champions";

export interface BoardRow {
  rank: number;
  handle: string;
  look: Look;
  value: number;
  slug?: string;
  note?: string;
  tier?: string | null;
}

export interface Badge {
  slug: string;
  name: string;
  imageUrl: string | null;
  score: number;
  rank: number;
  label: string;
}

export interface Place {
  value: number;
  rank: number | null;
}

export interface Standing {
  boards: boolean;
  handle: string | null;
  glaze: Place;
  week: Place;
  champions: Place;
}