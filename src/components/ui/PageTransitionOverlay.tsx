"use client";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 通用页面过渡遮罩。
 * - leaving=true  → 黑幕淡入（离开动画）
 * - entering=true → 黑幕淡出（入场动画，页面首次挂载时播放）
 */
export function PageTransitionOverlay({
  leaving = false,
  entering = false,
  color = "#080d1a",
  zIndex = 9999,
}: {
  leaving?: boolean;
  entering?: boolean;
  color?: string;
  zIndex?: number;
}) {
  return (
    <>
      {/* 离开遮罩：淡入黑幕 */}
      <AnimatePresence>
        {leaving && (
          <motion.div
            key="leaving"
            className="fixed inset-0 pointer-events-none"
            style={{ background: color, zIndex }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.32, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* 入场遮罩：挂载时黑幕淡出 */}
      {entering && (
        <motion.div
          key="entering"
          className="fixed inset-0 pointer-events-none"
          style={{ background: color, zIndex }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
      )}
    </>
  );
}
