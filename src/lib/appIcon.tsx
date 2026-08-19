import { ImageResponse } from "next/og";

const ACCENT = "#E8642A";

/** Same bolt mark as the landing navbar / extension icon, rendered as a PNG. */
export function appIconResponse(size: number, maskable = false) {
  const bolt = Math.round(size * (maskable ? 0.42 : 0.56));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: ACCENT,
        }}
      >
        <svg width={bolt} height={bolt} viewBox="0 0 24 24">
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="#ffffff" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
