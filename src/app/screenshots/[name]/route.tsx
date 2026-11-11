import { ImageResponse } from "next/og";

export const runtime = "nodejs";

const SHOTS: Record<string, { width: number; height: number }> = {
  "wide.png": { width: 1280, height: 720 },
  "narrow.png": { width: 720, height: 1280 },
};

const STEPS = [
  ["1", "Evidence"],
  ["2", "Verify"],
  ["3", "Rank"],
];

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const shot = SHOTS[name];
  if (!shot) return new Response("Not found", { status: 404 });

  const wide = shot.width > shot.height;
  const u = Math.min(shot.width, shot.height);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: u * 0.09,
          background: "#000000",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: u * 0.035, height: u * 0.035, background: "#c8ff00", marginRight: u * 0.025 }} />
          <div style={{ display: "flex", fontSize: u * 0.04, letterSpacing: u * 0.008 }}>NONI</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: u * (wide ? 0.115 : 0.125), lineHeight: 1.05, maxWidth: wide ? shot.width * 0.7 : shot.width }}>
            Fictional powerscaling, backed by evidence.
          </div>
          <div style={{ display: "flex", marginTop: u * 0.04, fontSize: u * 0.04, color: "#9a9a9a" }}>Verified feats. Fixed rules. Real matchups.</div>
        </div>

        <div style={{ display: "flex" }}>
          {STEPS.map(([n, label], index) => (
            <div
              key={n}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                border: "2px solid #2a2a2a",
                marginLeft: index === 0 ? 0 : -2,
                padding: u * 0.03,
              }}
            >
              <div style={{ display: "flex", fontSize: u * 0.07 }}>{n}</div>
              <div style={{ display: "flex", marginTop: u * 0.01, fontSize: u * 0.032, color: "#9a9a9a" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: shot.width, height: shot.height, headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
  );
}