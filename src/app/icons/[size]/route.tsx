import { ImageResponse } from "next/og";
import { MARK_BOX, MARK_PATH } from "@/lib/brand/mark";

export const runtime = "nodejs";

const SIZES = new Set([96, 192, 512]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: raw } = await params;
  const size = Number.parseInt(raw, 10);
  if (!SIZES.has(size) || raw !== `${size}.png`)
    return new Response("Not found", { status: 404 });

  /** Kept inside the middle 60 percent so the same file works as a maskable icon */
  const height = size * 0.5;
  const width = (height * MARK_BOX.w) / MARK_BOX.h;
  const mark = size * 0.07;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "#000000",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`${MARK_BOX.x} ${MARK_BOX.y} ${MARK_BOX.w} ${MARK_BOX.h}`}
      >
        <path d={MARK_PATH} fill="#ffffff" />
      </svg>
      <div
        style={{
          position: "absolute",
          top: size * 0.2,
          right: size * 0.2,
          width: mark,
          height: mark,
          background: "#c8ff00",
        }}
      />
    </div>,
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    },
  );
}
