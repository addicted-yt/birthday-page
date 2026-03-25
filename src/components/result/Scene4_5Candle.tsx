"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springGentle } from "@/lib/animationPresets";

interface Scene4_5CandleProps {
  onBlown: () => void;
  onEnter: () => void;
}

const LINES = [
  "闭上眼睛",
  "许一个只属于你的愿望",
  "然后……",
  "吹灭它",
];

// SVG 坐标常量
const SVG_W = 180;
const SVG_H = 175;
// 蜡烛芯顶端（SVG 坐标）— 火焰锚点
const WICK_X = 90;
const WICK_Y = 38;

// ── 火焰（SVG <g>，原点在芯顶端）────────────────────────
function FlameSVG({ visible, showSmoke }: { visible: boolean; showSmoke: boolean }) {
  return (
    // translate 到芯顶端，火焰向上生长（负 y 方向）
    <g transform={`translate(${WICK_X},${WICK_Y})`}>
      {/* 暖光晕 */}
      {visible && (
        <motion.ellipse
          cx={0} cy={0} rx={18} ry={10}
          fill="rgba(255,200,60,0.18)"
          style={{ filter: "blur(5px)" }}
          animate={{ ry: [10, 14, 10], opacity: [0.7, 0.35, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <AnimatePresence>
        {visible && (
          <motion.g
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0, transition: { duration: 0.3 } }}
            style={{ originX: "0px", originY: "0px" }}
            transition={{ ...springGentle, delay: 0.1 }}
          >
            {/* 外焰：泪滴形，底部居中在 (0,0)，向上延伸到 -38 */}
            <motion.path
              d="M0,0 C8,-8 12,-20 0,-38 C-12,-20 -8,-8 0,0 Z"
              fill="url(#flameOuter)"
              style={{ filter: "drop-shadow(0 0 5px rgba(255,160,30,0.8))" }}
              animate={{ x: [0, 1, -0.8, 0.6, 0], scaleX: [1, 1.1, 0.92, 1.06, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* 内芯 */}
            <motion.path
              d="M0,-4 C4,-10 6,-20 0,-32 C-6,-20 -4,-10 0,-4 Z"
              fill="url(#flameInner)"
              animate={{ scaleX: [1, 0.88, 1.08, 0.94, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* 烟雾粒子（吹灭后）*/}
      <AnimatePresence>
        {showSmoke && (
          <motion.g initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[0, 1, 2, 3].map((i) => (
              <motion.circle
                key={i}
                cx={0} cy={0}
                r={3 + i}
                fill="rgba(200,200,200,0.4)"
                style={{ filter: `blur(${2 + i * 0.5}px)` }}
                initial={{ opacity: 0.7, y: 0, x: 0, scale: 0.5 }}
                animate={{
                  opacity: 0,
                  y: -(20 + i * 14),
                  x: (i % 2 === 0 ? 1 : -1) * (3 + i * 2),
                  scale: [0.5, 1.3, 0.8],
                }}
                transition={{ duration: 1.2 + i * 0.2, delay: i * 0.1, ease: "easeOut" }}
              />
            ))}
          </motion.g>
        )}
      </AnimatePresence>
    </g>
  );
}

// ── 3D 蛋糕 SVG（撑满父容器）─────────────────────────
function CakeSVG({ phase, showSmoke }: { phase: string; showSmoke: boolean }) {
  const waiting = phase === "waiting";
  const flameVisible = phase !== "blown" && phase !== "done";
  return (
    <motion.div
      style={{ position: "relative", width: "100%", height: "100%" }}
      animate={waiting ? { y: [0, -4, 0] } : {}}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* 底部投影 */}
      <div style={{
        position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
        width: "72%", height: 14,
        borderRadius: "50%",
        background: "rgba(0,0,0,0.32)",
        filter: "blur(8px)",
      }} />

      <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          {/* 蛋糕侧面渐变 — 下层 */}
          <linearGradient id="side1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f5deb3" />
            <stop offset="40%" stopColor="#fff8f0" />
            <stop offset="100%" stopColor="#d4a96a" />
          </linearGradient>
          {/* 蛋糕侧面渐变 — 上层 */}
          <linearGradient id="side2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fce8c8" />
            <stop offset="40%" stopColor="#fff8f0" />
            <stop offset="100%" stopColor="#dbb87a" />
          </linearGradient>
          {/* 顶面渐变 */}
          <radialGradient id="topFace" cx="42%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#fff4e0" />
            <stop offset="100%" stopColor="#f0d9a8" />
          </radialGradient>
          {/* 中层顶面 */}
          <radialGradient id="midFace" cx="42%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#fff4e0" />
            <stop offset="100%" stopColor="#f0d9a8" />
          </radialGradient>
          {/* 奶油夹心 */}
          <linearGradient id="cream1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffb8c8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ffd6e0" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#f0909a" stopOpacity="0.8" />
          </linearGradient>
          {/* 蜡烛渐变 */}
          <linearGradient id="candleGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e8e8e8" />
            <stop offset="35%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#c0c0c0" />
          </linearGradient>
          {/* 火焰渐变 */}
          <radialGradient id="flameOuter" cx="50%" cy="90%" r="55%">
            <stop offset="0%" stopColor="#fff7a0" />
            <stop offset="35%" stopColor="#ffcc30" />
            <stop offset="70%" stopColor="#ff7a10" />
            <stop offset="100%" stopColor="#ff4500" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="flameInner" cx="50%" cy="90%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#fff5c0" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ffe060" stopOpacity="0" />
          </radialGradient>
          {/* 蜡烛顶部融蜡 */}
          <radialGradient id="wickGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffe090" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffcc40" stopOpacity="0" />
          </radialGradient>
          {/* 奶油花渐变 */}
          <radialGradient id="roseGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fce4ec" />
          </radialGradient>
        </defs>

        {/* ── 下层蛋糕侧面 ── */}
        <path d="M20 118 L20 142 Q90 158 160 142 L160 118 Q90 134 20 118Z" fill="url(#side1)" />
        {/* 下层底边椭圆 */}
        <ellipse cx="90" cy="142" rx="70" ry="10" fill="#d4a96a" opacity="0.5" />
        {/* 下层顶面椭圆 */}
        <ellipse cx="90" cy="118" rx="70" ry="11" fill="url(#topFace)" />
        {/* 下层顶面高光 */}
        <ellipse cx="72" cy="113" rx="28" ry="5" fill="rgba(255,255,255,0.45)" />

        {/* ── 奶油夹心层 ── */}
        <path d="M20 108 L20 118 Q90 134 160 118 L160 108 Q90 124 20 108Z" fill="url(#cream1)" />
        {/* 奶油波浪顶边 */}
        <path
          d="M20 108 Q32 103, 44 108 Q56 113, 68 108 Q80 103, 92 108 Q104 113, 116 108 Q128 103, 140 108 Q152 113, 160 108"
          stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none"
        />

        {/* ── 上层蛋糕侧面 ── */}
        <path d="M30 82 L30 108 Q90 122 150 108 L150 82 Q90 96 30 82Z" fill="url(#side2)" />
        {/* 上层底边 */}
        <ellipse cx="90" cy="108" rx="60" ry="9" fill="#dbb87a" opacity="0.4" />
        {/* 上层顶面 */}
        <ellipse cx="90" cy="82" rx="60" ry="10" fill="url(#midFace)" />
        {/* 上层高光 */}
        <ellipse cx="76" cy="78" rx="22" ry="4" fill="rgba(255,255,255,0.5)" />

        {/* ── 顶层奶油花装饰 ── */}
        {/* 奶油花 1 */}
        <ellipse cx="62" cy="79" rx="7" ry="4.5" fill="url(#roseGrad)" />
        <ellipse cx="62" cy="77" rx="5" ry="3" fill="rgba(255,255,255,0.8)" />
        {/* 奶油花 2 */}
        <ellipse cx="118" cy="79" rx="7" ry="4.5" fill="url(#roseGrad)" />
        <ellipse cx="118" cy="77" rx="5" ry="3" fill="rgba(255,255,255,0.8)" />
        {/* 小草莓点缀 */}
        <circle cx="62" cy="108" r="4" fill="#e05060" opacity="0.85" />
        <circle cx="118" cy="108" r="4" fill="#e05060" opacity="0.85" />
        <circle cx="90" cy="112" r="3.5" fill="#e05060" opacity="0.75" />
        {/* 草莓高光 */}
        <circle cx="60.5" cy="106.5" r="1.2" fill="rgba(255,255,255,0.7)" />
        <circle cx="116.5" cy="106.5" r="1.2" fill="rgba(255,255,255,0.7)" />

        {/* ── 蜡烛 ── */}
        {/* 蜡烛主体 */}
        <rect x="84" y="46" width="12" height="36" rx="3" fill="url(#candleGrad)" />
        {/* 蜡烛右侧阴影 */}
        <rect x="91" y="46" width="5" height="36" rx="2" fill="rgba(160,140,120,0.25)" />
        {/* 融蜡效果 */}
        <ellipse cx="90" cy="48" rx="7" ry="3.5" fill="#ffffff" opacity="0.9" />
        <path d="M86 49 Q84 54, 83 60" stroke="#f0e0c0" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
        {/* 芯 */}
        <line x1="90" y1="38" x2="90" y2="47" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
        {/* 芯根部发光 */}
        <ellipse cx="90" cy="47" rx="4" ry="2" fill="url(#wickGlow)" />

        {/* 火焰 + 烟雾（锚定在芯顶端）*/}
        <FlameSVG visible={flameVisible} showSmoke={showSmoke} />

        {/* ── 描边收尾 ── */}
        {/* 下层外轮廓 */}
        <path d="M20 118 Q90 134 160 118" stroke="rgba(180,140,90,0.25)" strokeWidth="0.8" fill="none" />
        <path d="M20 142 Q90 158 160 142" stroke="rgba(160,120,70,0.2)" strokeWidth="0.8" fill="none" />
        {/* 上层外轮廓 */}
        <path d="M30 82 Q90 96 150 82" stroke="rgba(180,140,90,0.2)" strokeWidth="0.8" fill="none" />
      </svg>

      {/* 火焰/烟雾挂载点（蜡烛芯正上方）*/}
    </motion.div>
  );
}

// ── 主组件 ────────────────────────────────────────────
export function Scene4_5Candle({ onBlown, onEnter }: Scene4_5CandleProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<"idle" | "subtitles" | "waiting" | "blown" | "done">("idle");
  const [visibleLines, setVisibleLines] = useState(0);
  const [showSmoke, setShowSmoke] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const hasEnteredRef = useRef(false);
  const hasBlownRef = useRef(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const onEnterRef = useRef(onEnter);
  const onBlownRef = useRef(onBlown);
  onEnterRef.current = onEnter;
  onBlownRef.current = onBlown;

  // 未吹蜡烛前：锁定向下滚动；同时用滚动手势触发 onEnter（规避 autoplay 拦截）
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let ty = 0;

    const triggerEnterFromGesture = () => {
      if (!hasEnteredRef.current) {
        hasEnteredRef.current = true;
        onEnterRef.current();
        setTimeout(() => setPhase("subtitles"), 800);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!hasBlownRef.current && e.deltaY > 0) {
        e.preventDefault();
        triggerEnterFromGesture();
      }
    };
    const onTouchStart = (e: TouchEvent) => { ty = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      if (!hasBlownRef.current && ty - e.touches[0].clientY > 0) {
        e.preventDefault();
        triggerEnterFromGesture();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  // 进入视口触发（兜底：若没有手势触发 onEnter，由此补触发）
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasEnteredRef.current) {
          hasEnteredRef.current = true;
          onEnterRef.current();
          setTimeout(() => setPhase("subtitles"), 800);
        } else if (entry.isIntersecting && hasEnteredRef.current) {
          // onEnter 已由手势触发，只启动字幕
          setTimeout(() => setPhase((p) => p === "idle" ? "subtitles" : p), 800);
        }
      },
      { threshold: 0.55 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // 字幕逐行展示
  useEffect(() => {
    if (phase !== "subtitles") return;
    let idx = 0;
    const showNext = () => {
      idx++;
      setVisibleLines(idx);
      // 最后一行"吹灭它"出现时立即开始监听麦克风，延迟 600ms 再显示提示词
      if (idx === LINES.length) {
        setPhase("waiting");
        startMicDetection();
        setTimeout(() => setShowHint(true), 600);
      } else {
        setTimeout(showNext, 700);
      }
    };
    setTimeout(showNext, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // 麦克风检测
  const startMicDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let loudCount = 0;
      const check = () => {
        if (hasBlownRef.current) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        if (avg > 62) {
          loudCount++;
          if (loudCount >= 4) {
            triggerBlown();
            stream.getTracks().forEach((t) => t.stop());
            ctx.close();
            return;
          }
        } else {
          loudCount = 0;
        }
        animFrameRef.current = requestAnimationFrame(check);
      };
      animFrameRef.current = requestAnimationFrame(check);
    } catch {
      // 权限拒绝：降级为仅点击
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerBlown = useCallback(() => {
    if (hasBlownRef.current) return;
    hasBlownRef.current = true;
    cancelAnimationFrame(animFrameRef.current);
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    setPhase("blown");
    setShowHint(false);
    setShowSmoke(true);
    setTimeout(() => {
      setShowSmoke(false);
      setPhase("done");
      // 不自动跳转，显示下滑提示让用户自己滑
    }, 1400);
  }, []);

  // 清理麦克风
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // done 阶段：section 滑出视口时触发 onBlown 回调
  useEffect(() => {
    if (phase !== "done") return;
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          obs.disconnect();
          onBlownRef.current();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [phase]);

  const flameVisible = phase !== "blown" && phase !== "done";
  void flameVisible; // 已移入 CakeSVG

  return (
    <section
      ref={sectionRef}
      className="scroll-snap-start"
      style={{ zIndex: 10, height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(1.6rem, 5vw, 2.8rem)" }}>

        {/* 蛋糕（含火焰/烟雾，已内嵌 SVG 坐标系）*/}
        <motion.div
          style={{
            position: "relative",
            width: `clamp(140px, 46vw, ${SVG_W}px)`,
            aspectRatio: `${SVG_W} / ${SVG_H}`,
            cursor: phase === "waiting" ? "pointer" : "default",
          }}
          initial={{ opacity: 0, y: 28, scale: 0.82 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ ...springGentle, delay: 0.3 }}
          onClick={() => { if (phase === "waiting") triggerBlown(); }}
          whileHover={phase === "waiting" ? { scale: 1.04 } : {}}
          whileTap={phase === "waiting" ? { scale: 0.96 } : {}}
        >
          <CakeSVG phase={phase} showSmoke={showSmoke} />

          {/* 等待阶段脉冲光圈 */}
          {phase === "waiting" && (
            <motion.div
              style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,210,80,0.09) 0%, transparent 70%)",
                transform: "scale(1.4)",
                pointerEvents: "none",
              }}
              animate={{ scale: [1.4, 2.0, 1.4], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>

        {/* 字幕区 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", minHeight: "6rem" }}>
          {LINES.map((line, i) => (
            <motion.p
              key={i}
              className="font-light select-none"
              style={{
                fontSize: "clamp(0.9rem, 2.5vw, 1.3rem)",
                letterSpacing: "0.25em",
                color: i === LINES.length - 1 ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.65)",
                lineHeight: 1.8,
                margin: 0,
                opacity: visibleLines > i ? 1 : 0,
                transform: visibleLines > i ? "translateY(0)" : "translateY(10px)",
                transition: visibleLines > i
                  ? "opacity 0.8s ease, transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)"
                  : "none",
              }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        {/* 底部提示区 */}
        <AnimatePresence mode="wait">
          {showHint && phase === "waiting" && (
            <motion.div
              key="blow"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ ...springGentle }}
            >
              <motion.span
                style={{ fontSize: "clamp(0.72rem, 1.4vw, 0.9rem)", letterSpacing: "0.35em", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}
                animate={{ opacity: [0.30, 1, 0.30], y: [0, -3, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                对着屏幕吹一口气
              </motion.span>
              <motion.div
                style={{ width: "1px", height: "18px", background: "rgba(255,255,255,0.50)", originY: 0 }}
                animate={{ scaleY: [0.2, 1, 0.2], opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          )}
          {phase === "done" && (
            <motion.div
              key="scroll"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springGentle, delay: 0.3 }}
            >
              <motion.span
                style={{ fontSize: "clamp(0.72rem, 1.4vw, 0.9rem)", letterSpacing: "0.35em", color: "rgba(255,255,255,0.75)" }}
                animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                请下滑继续
              </motion.span>
              <motion.div
                style={{ width: "1px", height: "22px", background: "rgba(255,255,255,0.50)", originY: 0 }}
                animate={{ scaleY: [0.2, 1, 0.2], opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
