import { isFrame, isTitle, type FrameId, type TitleId } from "@/lib/flair/rules";

export const BANNER_THEMES = ["plain", "grid", "stripes", "dots", "bars", "ink"] as const;
export type BannerTheme = (typeof BANNER_THEMES)[number];

export const THEME_LABELS: Record<BannerTheme, string> = {
  plain: "Plain",
  grid: "Grid",
  stripes: "Stripes",
  dots: "Dots",
  bars: "Bars",
  ink: "Ink",
};

export const DEFAULT_THEME: BannerTheme = "grid";

export interface Look {
  avatarId: string | null;
  avatarName: string | null;
  avatarUrl: string | null;
  bannerTheme: BannerTheme;
  bannerId: string | null;
  bannerUrl: string | null;
  /** Bought flair, only present when the player has equipped one */
  frame?: FrameId;
  title?: TitleId;
}

const isTheme = (value: unknown): value is BannerTheme =>
  typeof value === "string" && (BANNER_THEMES as readonly string[]).includes(value);
const text = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;
const image = (value: unknown): string | null =>
  typeof value === "string" && value.startsWith("https://") ? value : null;

/** Reads the appearance fields of a user document, falling back to safe defaults */
export function readLook(data: { [key: string]: unknown }): Look {
  return {
    avatarId: text(data.avatarId),
    avatarName: text(data.avatarName),
    avatarUrl: image(data.avatarUrl),
    bannerTheme: isTheme(data.bannerTheme) ? data.bannerTheme : DEFAULT_THEME,
    bannerId: text(data.bannerId),
    bannerUrl: image(data.bannerUrl),
    ...(isFrame(data.frame) ? { frame: data.frame } : {}),
    ...(isTitle(data.flairTitle) ? { title: data.flairTitle } : {}),
  };
}
