import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        position: "relative",
      }}
    >
      <div style={{ fontSize: 112, fontWeight: 700, color: "#fafaf7", lineHeight: 1 }}>
        N
      </div>
      <div
        style={{
          position: "absolute",
          top: 30,
          right: 30,
          width: 22,
          height: 22,
          background: "#c8ff00",
        }}
      />
    </div>,
    size,
  );
}
