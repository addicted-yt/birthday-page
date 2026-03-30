"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { springGentle, springPress } from "@/lib/animationPresets";

interface CreatorToolbarProps {
  shareUrl: string;
  sessionId: string | null;
  onNavigateAway?: () => void;
  onTakeSnapshot?: () => void;
  snapshotLoading?: boolean;
}

export function CreatorToolbar({ shareUrl, sessionId, onNavigateAway, onTakeSnapshot, snapshotLoading }: CreatorToolbarProps) {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setShowToast(true);
    const timer = setTimeout(() => setShowToast(false), 60000);
    return () => clearTimeout(timer);
  };

  return (
    <>
      {/* 悬浮操作栏 */}
      <motion.div
        className="fixed bottom-13 left-1/2 z-[200] flex items-center gap-3"
        style={{ translateX: "-50%" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springGentle, delay: 1.2 }}
      >
        {/* 修改按钮 */}
        <motion.button
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-light text-xs tracking-widest"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.14)",
            color: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.10)" }}
          whileTap={{ scale: 0.96 }}
          transition={springPress}
          onClick={() => { onNavigateAway?.(); router.push(sessionId ? `/create?sid=${sessionId}` : "/create"); }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8.5 1.5L3 7l2 2 5.5-5.5L8.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 11h3l-3-3v3z" fill="currentColor"/>
          </svg>
          继续修改
        </motion.button>

        {/* 分享按钮 */}
        <motion.button
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-light text-xs tracking-widest"
          style={{
            background: "rgba(255,255,255,0.92)",
            color: "#050810",
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={springPress}
          onClick={handleShare}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v7M3 4l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 9v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          分享给 TA
        </motion.button>
      </motion.div>

      {/* Toast 弹窗 — 页面中央 */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="fixed left-1/2 z-[300]"
            style={{ top: "50%", translateX: "-50%", translateY: "-50%" }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={springGentle}
          >
            <div
              className="flex flex-col items-center gap-1 px-6 py-5 rounded-2xl"
              style={{
                background: "rgba(18,22,42,0.96)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                position: "relative",
                minWidth: "240px",
              }}
            >
              {/* × 关闭按钮 */}
              <button
                onClick={() => setShowToast(false)}
                style={{
                  position: "absolute", top: 8, right: 10,
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.30)", fontSize: "1rem", lineHeight: 1,
                  padding: "2px 4px",
                }}
              >×</button>
              <p className="text-white/90 text-sm font-light tracking-wider">
                链接已复制
              </p>
              <p className="text-white/45 text-xs tracking-wide">
                快分享给 TA 看看吧 ✨
              </p>
              <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.50)", letterSpacing: "0.06em", marginTop: "6px", textAlign: "center", lineHeight: 1.7 }}>
                图片将在 15 天后从云端自动清除<br />
                请尽快分享，以免 TA 错过<br />
                <motion.button
                  onClick={() => { setShowToast(false); onTakeSnapshot?.(); }}
                  disabled={snapshotLoading}
                  style={{
                    color: snapshotLoading ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.70)",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                    background: "none",
                    border: "none",
                    cursor: snapshotLoading ? "not-allowed" : "pointer",
                    fontSize: "inherit",
                    letterSpacing: "inherit",
                    padding: 0,
                    marginTop: "4px",
                    display: "inline-block",
                  }}
                  whileTap={{ scale: 0.94 }}
                >
                  {snapshotLoading ? "截图中…" : "也可截长图保存页面"}
                </motion.button>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
