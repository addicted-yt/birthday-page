"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { GiftImage } from "@/types/birthday";
import { springGentle } from "@/lib/animationPresets";

interface Scene5PhotosProps {
  giftImages: GiftImage[];
}

const slideSpring = { type: "spring" as const, damping: 32, stiffness: 180, mass: 1 };
const AUTO_INTERVAL = 3800;

export function Scene5Photos({ giftImages }: Scene5PhotosProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const go = useCallback((dir: number) => {
    setDirection(dir);
    setCurrent((c) => (c + dir + giftImages.length) % giftImages.length);
    setProgressKey((k) => k + 1);
  }, [giftImages.length]);

  const goTo = useCallback((i: number, cur: number) => {
    setDirection(i > cur ? 1 : -1);
    setCurrent(i);
    setProgressKey((k) => k + 1);
  }, []);

  // 进入视口激活
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // 只在图片本身上 hover 时暂停，用 document 级事件避免丢失
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const onEnter = () => setPaused(true);
    const onLeave = () => setPaused(false);
    img.addEventListener("mouseenter", onEnter);
    img.addEventListener("mouseleave", onLeave);
    return () => {
      img.removeEventListener("mouseenter", onEnter);
      img.removeEventListener("mouseleave", onLeave);
    };
  }, [current]); // current 变化时重新绑（img DOM 可能重渲染）

  // 自动轮播
  useEffect(() => {
    if (!active || paused || giftImages.length <= 1) return;
    const t = setTimeout(() => go(1), AUTO_INTERVAL);
    return () => clearTimeout(t);
  }, [current, active, paused, go, giftImages.length]);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "55%" : "-55%",
      opacity: 0,
      scale: 0.92,
      filter: "blur(6px)",
    }),
    center: { x: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: (dir: number) => ({
      x: dir > 0 ? "-55%" : "55%",
      opacity: 0,
      scale: 0.92,
      filter: "blur(6px)",
    }),
  };

  if (giftImages.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="scroll-snap-start flex flex-col items-center justify-center relative"
      style={{ zIndex: 10, minHeight: "100dvh" }}
    >
      {/* 顶部细线 */}
      <motion.div
        style={{ width: "1px", height: "36px", background: "rgba(255,255,255,0.08)", marginBottom: "clamp(1.4rem,4vh,2.4rem)" }}
        initial={{ scaleY: 0, opacity: 0 }}
        whileInView={{ scaleY: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ ...springGentle, delay: 0.1 }}
      />

      {/* 图片区域（箭头 + 主图） */}
      <div className="relative flex items-center justify-center w-full">
        {/* 左箭头 */}
        {giftImages.length > 1 && (
          <motion.button
            className="absolute left-4 z-20 w-9 h-9 flex items-center justify-center"
            style={{ color: "rgba(255,255,255,0.22)" }}
            onClick={() => go(-1)}
            whileHover={{ color: "rgba(255,255,255,0.65)", scale: 1.12 }}
            whileTap={{ scale: 0.85 }}
            transition={springGentle}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 2L4 8L10 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        )}

        {/* 主图 */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: "100%", height: "clamp(300px, 55vh, 520px)" }}
        >
          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideSpring}
              className="absolute"
              style={{ maxWidth: "min(82vw, 420px)", maxHeight: "clamp(300px, 55vh, 520px)" }}
            >
              <img
                ref={imgRef}
                src={giftImages[current].dataUrl}
                alt=""
                loading="lazy"
                draggable={false}
                style={{
                  display: "block",
                  maxWidth: "min(82vw, 420px)",
                  maxHeight: "clamp(300px, 55vh, 520px)",
                  width: "auto",
                  height: "auto",
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
                  cursor: "default",
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: "18px",
                  background: "linear-gradient(180deg, rgba(5,8,16,0.12) 0%, transparent 30%, transparent 70%, rgba(5,8,16,0.25) 100%)",
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 右箭头 */}
        {giftImages.length > 1 && (
          <motion.button
            className="absolute right-4 z-20 w-9 h-9 flex items-center justify-center"
            style={{ color: "rgba(255,255,255,0.22)" }}
            onClick={() => go(1)}
            whileHover={{ color: "rgba(255,255,255,0.65)", scale: 1.12 }}
            whileTap={{ scale: 0.85 }}
            transition={springGentle}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2L12 8L6 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        )}
      </div>

      {/* 指示器进度条 */}
      {giftImages.length > 1 && (
        <div className="flex gap-2 items-center" style={{ marginTop: "clamp(1.2rem,3vh,2rem)" }}>
          {giftImages.map((_, i) => {
            const isActive = i === current;
            return (
              <button
                key={i}
                onClick={() => goTo(i, current)}
                style={{
                  position: "relative",
                  width: isActive ? 48 : 5,
                  height: 5,
                  borderRadius: 3,
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  background: "rgba(255,255,255,0.15)",
                  transition: "width 0.45s cubic-bezier(0.4,0,0.2,1)",
                  overflow: "hidden",
                }}
              >
                {isActive && (
                  <motion.div
                    key={progressKey}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      height: "100%",
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.82)",
                      originX: 0,
                    }}
                    initial={{ width: "0%" }}
                    animate={{ width: paused ? undefined : "100%" }}
                    transition={
                      paused
                        ? { duration: 0 }
                        : { duration: AUTO_INTERVAL / 1000, ease: "linear" }
                    }
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* n / total */}
      <p
        className="font-light select-none"
        style={{ fontSize: "0.65rem", letterSpacing: "0.4em", color: "rgba(255,255,255,0.18)", marginTop: "0.7rem" }}
      >
        {current + 1} / {giftImages.length}
      </p>

      {/* 底部细线 */}
      <motion.div
        style={{ width: "1px", height: "36px", background: "rgba(255,255,255,0.06)", marginTop: "clamp(1.4rem,4vh,2.4rem)" }}
        initial={{ scaleY: 0, opacity: 0 }}
        whileInView={{ scaleY: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ ...springGentle, delay: 0.3 }}
      />
    </section>
  );
}
