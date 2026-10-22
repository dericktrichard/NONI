import "server-only";
import sharp from "sharp";

export const IMAGE = {
  maxBytes: 4 * 1024 * 1024,
  maxPixels: 40_000_000,
  width: 640,
  height: 960,
  quality: 82,
} as const;

export async function processImage(input: Buffer): Promise<Buffer> {
  return sharp(input, { limitInputPixels: IMAGE.maxPixels })
    .rotate()
    .resize({ width: IMAGE.width, height: IMAGE.height, fit: "inside", withoutEnlargement: true })
    .webp({ quality: IMAGE.quality })
    .toBuffer();
}