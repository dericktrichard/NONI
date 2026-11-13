import "server-only";
import sharp from "sharp";

const MAX_BYTES = 5_000_000;
const TIMEOUT_MS = 4_000;

/** The card renderer cannot decode WebP, so portraits become small JPEG data URIs. Null when anything fails. */
export async function portraitDataUri(
  url: string | null,
  width: number,
  height: number,
): Promise<string | null> {
  if (!url || !url.startsWith("https://")) return null;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return null;
    if (Number(response.headers.get("content-length") ?? 0) > MAX_BYTES) return null;

    const input = Buffer.from(await response.arrayBuffer());
    if (input.byteLength > MAX_BYTES) return null;

    const output = await sharp(input)
      .resize(width, height, { fit: "cover", position: "top" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${output.toString("base64")}`;
  } catch {
    return null;
  }
}
