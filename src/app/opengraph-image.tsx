import { ImageResponse } from "next/og";

export const alt =
  "Sitovai — find local businesses without a website and build them one with AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded 1200×630 social card. Satori supports flexbox + a subset of CSS only,
// so layout uses flex throughout and the gradient lives on solid element
// backgrounds (reliable) rather than clipped text.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#06060a",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        {/* glow accent — spans the full canvas so the gradient has no visible edge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1200px",
            height: "630px",
            background:
              "radial-gradient(farthest-corner at 62% 4%, rgba(99,102,241,0.42), rgba(139,92,246,0.12) 42%, transparent 68%)",
            display: "flex",
          }}
        />

        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6 55%, #22d3ee)",
              fontSize: "44px",
              fontWeight: 700,
              color: "white",
            }}
          >
            S
          </div>
          <div style={{ marginLeft: "24px", fontSize: "44px", fontWeight: 700 }}>
            Sitovai
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "76px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: "1000px",
              display: "flex",
            }}
          >
            Find businesses with no website — build them one with AI.
          </div>
          <div
            style={{
              marginTop: "28px",
              fontSize: "30px",
              color: "#a1a1aa",
              maxWidth: "900px",
              display: "flex",
            }}
          >
            Google Places + YTJ registry leads → ready-to-launch Finnish sites.
          </div>
        </div>

        {/* footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "26px",
            color: "#71717a",
          }}
        >
          <div style={{ display: "flex" }}>
            AI lead-gen for Finnish local business
          </div>
          <div style={{ display: "flex", color: "#a5b4fc", fontWeight: 600 }}>
            sitovai.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
