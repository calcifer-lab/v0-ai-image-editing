import { ImageResponse } from "next/og";
export const runtime = "nodejs";
export const alt =
  "DeepSeek V4.1 Flash 1017 — Benchmarks, pricing and model research on ReDiagram";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 70,
          background: "#f8f8f3",
          color: "#1e3529",
        }}
      >
        <div style={{ display: "flex", fontSize: 24 }}>
          ReDiagram / Model playground
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 76,
            fontWeight: 700,
          }}
        >
          <span>DeepSeek V4.1</span>
          <span>Flash 1017</span>
        </div>
        <div style={{ display: "flex", fontSize: 26 }}>
          Online trial · API examples · OpenCode
        </div>
        <div style={{ display: "flex", fontSize: 18 }}>
          Independent resource. Not affiliated with DeepSeek.
        </div>
      </div>
    ),
    size,
  );
}
