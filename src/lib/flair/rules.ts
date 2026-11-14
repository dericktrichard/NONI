export const FRAME_IDS = ["line", "double", "heavy", "mark"] as const;
export type FrameId = (typeof FRAME_IDS)[number];

export const TITLE_IDS = [
  "powerscaler",
  "lore-keeper",
  "feat-hunter",
  "underdog",
  "no-limits",
  "last-word",
] as const;
export type TitleId = (typeof TITLE_IDS)[number];

export type FlairKind = "frame" | "title";

export interface FlairItem<T extends string> {
  id: T;
  label: string;
  /** Glaze, bought once and not refundable */
  price: number;
}

export const FRAMES: ReadonlyArray<FlairItem<FrameId>> = [
  { id: "line", label: "Line", price: 200 },
  { id: "double", label: "Double", price: 300 },
  { id: "heavy", label: "Heavy", price: 400 },
  { id: "mark", label: "Mark", price: 500 },
];

export const TITLES: ReadonlyArray<FlairItem<TitleId>> = [
  { id: "powerscaler", label: "Powerscaler", price: 300 },
  { id: "lore-keeper", label: "Lore keeper", price: 300 },
  { id: "feat-hunter", label: "Feat hunter", price: 300 },
  { id: "underdog", label: "Underdog", price: 300 },
  { id: "no-limits", label: "No limits", price: 300 },
  { id: "last-word", label: "Last word", price: 300 },
];

export const isFrame = (value: unknown): value is FrameId =>
  typeof value === "string" && (FRAME_IDS as readonly string[]).includes(value);

export const isTitle = (value: unknown): value is TitleId =>
  typeof value === "string" && (TITLE_IDS as readonly string[]).includes(value);

/** What an item is and costs, or null when the id is not in the catalogue */
export function findFlair(id: string): { kind: FlairKind; price: number } | null {
  const frame = FRAMES.find((item) => item.id === id);
  if (frame) return { kind: "frame", price: frame.price };
  const title = TITLES.find((item) => item.id === id);
  if (title) return { kind: "title", price: title.price };
  return null;
}

export const titleLabel = (id: string | null | undefined): string | null =>
  TITLES.find((item) => item.id === id)?.label ?? null;
