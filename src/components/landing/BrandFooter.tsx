"use client";
import { motion } from "framer-motion";

export function BrandFooter({ opacity = 0.35 }: { opacity?: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p
        className="text-xs tracking-widest font-light"
        style={{ opacity, fontSize: "12px" }}
      >
        crafted by yt
      </p>
      <motion.a
        href="mailto:z3125243839@163.com?subject=祝福网站反馈"
        whileTap={{ scale: 0.90 }}
        style={{
          fontSize: "clamp(0.62rem, 1.2vw, 0.72rem)",
          letterSpacing: "0.18em",
          color: "rgba(255,255,255,0.28)",
          textDecoration: "none",
          whiteSpace: "nowrap",
          display: "block",
        }}
      >
        · 意见反馈 ·
      </motion.a>
    </div>
  );
}
