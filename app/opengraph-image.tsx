import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630
};

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "linear-gradient(140deg, #050608 0%, #0e1015 55%, #141925 100%)",
          color: "#f9fafb",
          padding: "64px",
          fontFamily: "Segoe UI"
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: 3,
            fontWeight: 800,
            marginBottom: 16
          }}
        >
          <span style={{ color: "#E50914" }}>WATCH</span>
          <span style={{ color: "#FFFFFF" }}>MIRROR</span>
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>Stream Without Limits.</div>
        <div style={{ fontSize: 28, marginTop: 20, color: "#9ca3af" }}>Movies and Series in one place</div>
      </div>
    ),
    { ...size }
  );
}
