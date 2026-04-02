"use client";
import { motion } from "framer-motion";
import { springGentle } from "@/lib/animationPresets";

interface Scene0CurtainProps {
  onStart: () => void;
  isLoading?: boolean;
}

export function Scene0Curtain({ onStart, isLoading = false }: Scene0CurtainProps) {
  return (
    <motion.div
      key="curtain"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#080d1a",
        gap: "clamp(2rem, 6vw, 3.5rem)",
        pointerEvents: "auto",
        touchAction: "none",
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: "blur(12px)" }}
      transition={{ duration: 0.95, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* 顶部装饰线 */}
      <motion.div
        style={{
          width: "clamp(2rem, 8vw, 4rem)",
          height: "1px",
          background: "rgba(255,255,255,0.18)",
        }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ ...springGentle, delay: 0.3 }}
      />

      {/* 提示文字 */}
      <motion.div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(0.6rem, 2vw, 1rem)",
          textAlign: "center",
          padding: "0 clamp(1.5rem, 6vw, 3rem)",
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springGentle, delay: 0.45 }}
      >
        <p
          style={{
            fontSize: "clamp(1rem, 2.8vw, 1.25rem)",
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.75)",
            fontWeight: 300,
            lineHeight: 1.9,
            margin: 0,
          }}
        >
          即将开始一段中途带有音乐的体验
        </p>
        <p
          style={{
            fontSize: "clamp(0.9rem, 2.2vw, 1.05rem)",
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.50)",
            fontWeight: 300,
            margin: 0,
          }}
        >
          建议调整设备音量至舒适
        </p>
      </motion.div>

      {/* 启幕按钮 */}
      <motion.button
        style={{
          fontSize: "clamp(0.82rem, 2vw, 0.95rem)",
          letterSpacing: "0.45em",
          color: "rgba(255,255,255,0.82)",
          fontWeight: 300,
          background: "none",
          border: "1px solid rgba(255,255,255,0.22)",
          borderRadius: "999px",
          padding: "clamp(0.6rem, 2vw, 0.8rem) clamp(1.8rem, 5vw, 2.8rem)",
          cursor: isLoading ? "wait" : "pointer",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          opacity: isLoading ? 0.6 : 1,
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isLoading ? 0.6 : 1, y: 0 }}
        transition={{ ...springGentle, delay: 0.7 }}
        whileHover={!isLoading ? {
          background: "rgba(255,255,255,0.07)",
          borderColor: "rgba(255,255,255,0.38)",
          color: "rgba(255,255,255,0.95)",
        } : {}}
        whileTap={!isLoading ? { scale: 0.95 } : {}}
        onClick={() => {
          if (!isLoading) onStart();
        }}
        disabled={isLoading}
      >
        {isLoading ? "加载中…" : "启幕"}
      </motion.button>

      {/* 底部装饰线 */}
      <motion.div
        style={{
          width: "clamp(2rem, 8vw, 4rem)",
          height: "1px",
          background: "rgba(255,255,255,0.18)",
        }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ ...springGentle, delay: 0.3 }}
      />
    </motion.div>
  );
}
