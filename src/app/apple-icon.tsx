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
          background: "radial-gradient(circle at 45% 40%, #141a30 0%, #090c18 100%)",
          borderRadius: 38,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* 暖色光晕层 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 180,
            height: 180,
            borderRadius: 38,
            background: "radial-gradient(circle at 55% 62%, rgba(190,150,70,0.16) 0%, rgba(190,150,70,0.04) 60%, transparent 100%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 180,
            height: 180,
            borderRadius: 38,
            background: "radial-gradient(circle at 50% 50%, rgba(210,175,90,0.12) 0%, transparent 100%)",
            display: "flex",
          }}
        />

        {/* 环境星光点 */}
        <div style={{ position: "absolute", left: 119, top: 53, width: 2.5, height: 2.5, background: "#a0a8c8", borderRadius: "50%", opacity: 0.35, display: "flex" }} />
        <div style={{ position: "absolute", left: 53, top: 63, width: 1.8, height: 1.8, background: "#b0a890", borderRadius: "50%", opacity: 0.25, display: "flex" }} />
        <div style={{ position: "absolute", left: 133, top: 119, width: 2, height: 2, background: "#c0b098", borderRadius: "50%", opacity: 0.2, display: "flex" }} />
        <div style={{ position: "absolute", left: 42, top: 123, width: 1.5, height: 1.5, background: "#a0a0c0", borderRadius: "50%", opacity: 0.2, display: "flex" }} />
        <div style={{ position: "absolute", left: 126, top: 39, width: 1.5, height: 1.5, background: "#b8b0c0", borderRadius: "50%", opacity: 0.18, display: "flex" }} />
        <div style={{ position: "absolute", left: 60, top: 133, width: 2, height: 2, background: "#a8a0b0", borderRadius: "50%", opacity: 0.15, display: "flex" }} />
        <div style={{ position: "absolute", left: 105, top: 137, width: 1.2, height: 1.2, background: "#c0a888", borderRadius: "50%", opacity: 0.18, display: "flex" }} />

        {/* 星星（偏左上，微旋转-6度） */}
        {/* 中心点约 (80, 86)，缩放比例 180/512 ≈ 0.3515625 */}
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 86,
            transform: "translate(-50%, -50%) rotate(-6deg)",
            display: "flex",
          }}
        >
          {/* 星的光晕（模糊效果） */}
          <div
            style={{
              position: "absolute",
              left: -12,
              top: -12,
              width: 24,
              height: 24,
              background: "#c8a96e",
              opacity: 0.2,
              filter: "blur(3px)",
              clipPath: "polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)",
              display: "flex",
            }}
          />
          {/* 星本体 */}
          <div
            style={{
              position: "absolute",
              left: -9,
              top: -9,
              width: 18,
              height: 18,
              background: "#c8a96e",
              clipPath: "polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)",
              display: "flex",
            }}
          />
          {/* 亮核 */}
          <div
            style={{
              position: "absolute",
              left: -2,
              top: -2,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#dabb7a",
              opacity: 0.95,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -1,
              top: -1,
              width: 2,
              height: 2,
              borderRadius: "50%",
              background: "#eee0b8",
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
