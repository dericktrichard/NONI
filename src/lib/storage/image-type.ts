export type ImageType = "jpeg" | "png" | "webp";

export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";

  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((byte, i) => bytes[i] === byte)) return "png";

  const tag = (start: number, text: string) => [...text].every((char, i) => bytes[start + i] === char.charCodeAt(0));
  if (tag(0, "RIFF") && tag(8, "WEBP")) return "webp";

  return null;
}