import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0e1220 0%, #070910 100%)",
          borderRadius: 38,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* 内页（奶白色） */}
        <div
          style={{
            position: "absolute",
            left: 52,
            top: 25,
            width: 96,
            height: 130,
            background: "linear-gradient(160deg, #f5f0e8 0%, #e8e0d0 100%)",
            borderRadius: 3,
            display: "flex",
          }}
        />
        {/* 内页文字线条 */}
        <div style={{ position: "absolute", left: 68, top: 72, width: 64, height: 2, background: "rgba(176,168,152,0.55)", display: "flex" }} />
        <div style={{ position: "absolute", left: 68, top: 82, width: 48, height: 2, background: "rgba(176,168,152,0.4)", display: "flex" }} />
        <div style={{ position: "absolute", left: 68, top: 92, width: 56, height: 2, background: "rgba(176,168,152,0.3)", display: "flex" }} />
        {/* 内页金色装饰（用几何图形代替特殊字符，避免字体加载失败） */}
        <div style={{
          position: "absolute",
          left: 91,
          top: 40,
          width: 14,
          height: 14,
          background: "#c8a96e",
          display: "flex",
          transform: "rotate(45deg)",
        }} />
        {/* 封面（深色，偏左） */}
        <div
          style={{
            position: "absolute",
            left: 22,
            top: 25,
            width: 34,
            height: 130,
            background: "linear-gradient(160deg, #1c2038 0%, #111525 100%)",
            borderRadius: "3px 0 0 3px",
            display: "flex",
          }}
        />
        {/* 封面装订线 */}
        <div style={{ position: "absolute", left: 55, top: 25, width: 1, height: 130, background: "rgba(0,0,0,0.25)", display: "flex" }} />
        {/* 封面中心星（菱形几何） */}
        <div style={{
          position: "absolute",
          left: 31,
          top: 76,
          width: 18,
          height: 18,
          background: "rgba(255,255,255,0.75)",
          display: "flex",
          transform: "rotate(45deg)",
        }} />
        <div style={{
          position: "absolute",
          left: 35,
          top: 80,
          width: 10,
          height: 10,
          background: "rgba(255,255,255,0.95)",
          display: "flex",
          transform: "rotate(45deg)",
        }} />
      </div>
    ),
    { ...size }
  );
}
