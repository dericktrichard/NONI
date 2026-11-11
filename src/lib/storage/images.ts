import "server-only";
import sharp from "sharp";

export const IMAGE = {
  maxBytes: 4 * 1024 * 1024,
  maxPixels: 40_000_000,
  width: 640,
  height: 960,
  quality: 82,
} as const;

export const PROFILE_IMAGE = {
  maxBytes: 1_500_000,
  avatar: { width: 512, height: 512 },
  banner: { width: 1920, height: 720 },
  quality: 82,
} as const;

export async function processImage(input: Buffer): Promise<Buffer> {
  return sharp(input, { limitInputPixels: IMAGE.maxPixels })
    .rotate()
    .resize({
      width: IMAGE.width,
      height: IMAGE.height,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: IMAGE.quality })
    .toBuffer();
}

/** Square avatar or wide banner, cropped to fill, re-encoded with all metadata dropped */
export function processProfileImage(
  input: Buffer,
  kind: "avatar" | "banner",
): Promise<Buffer> {
  const { width, height } = PROFILE_IMAGE[kind];
  return sharp(input, { limitInputPixels: IMAGE.maxPixels })
    .rotate()
    .resize({ width, height, fit: "cover" })
    .webp({ quality: PROFILE_IMAGE.quality })
    .toBuffer();
}
