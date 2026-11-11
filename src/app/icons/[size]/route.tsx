import { ImageResponse } from "next/og";

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

  const w = size * 0.38;
  const h = size * 0.44;
  const bar = size * 0.09;
  const mark = size * 0.075;
  const length = Math.hypot(w - bar, h);
  const tilt = (-Math.atan((w - bar) / h) * 180) / Math.PI;
  const white = "#ffffff";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
      }}
    >
      <div style={{ position: "relative", display: "flex", width: w, height: h }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: bar,
            height: h,
            background: white,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: bar,
            height: h,
            background: white,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: (w - bar) / 2,
            top: (h - length) / 2,
            width: bar,
            height: length,
            background: white,
            transform: `rotate(${tilt}deg)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -mark * 1.8,
            bottom: 0,
            width: mark,
            height: mark,
            background: "#c8ff00",
          }}
        />
      </div>
    </div>,
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    },
  );
}
