import { ImageResponse } from "next/og";
import { MARK_BOX, MARK_PATH } from "@/lib/brand/mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const height = 104;
  const width = (height * MARK_BOX.w) / MARK_BOX.h;

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
      <svg
        width={width}
        height={height}
        viewBox={`${MARK_BOX.x} ${MARK_BOX.y} ${MARK_BOX.w} ${MARK_BOX.h}`}
      >
        <path d={MARK_PATH} fill="#fafaf7" />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 20,
          height: 20,
          background: "#c8ff00",
        }}
      />
    </div>,
    size,
  );
}
