"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springGentle } from "@/lib/animationPresets";

interface Scene4_5CandleProps {
  onBlown: () => void;
  onEnter: () => void;
  onExiting?: () => void;  // 吹完后用户开始下滑时立即触发（早于 onBlown）
  onMicEnded?: () => void;
  onMicPromptChange?: (active: boolean) => void;
}

const LINES = [
  "闭上眼睛",
  "许一个只属于你的愿望",
  "然后...",
  "吹灭它",
];

const SVG_W = 180;
const SVG_H = 175;
const WICK_X = 90;
const WICK_Y = 38;

function FlameSVG({ visible, showSmoke }: { visible: boolean; showSmoke: boolean }) {
  return (
    <g transform={`translate(${WICK_X},${WICK_Y})`}>
      {visible && (
        <motion.ellipse
          cx={0}
          cy={0}
          rx={18}
          ry={10}
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
            <motion.path
              d="M0,0 C8,-8 12,-20 0,-38 C-12,-20 -8,-8 0,0 Z"
              fill="url(#flameOuter)"
              style={{ filter: "drop-shadow(0 0 5px rgba(255,160,30,0.8))" }}
              animate={{ x: [0, 1, -0.8, 0.6, 0], scaleX: [1, 1.1, 0.92, 1.06, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M0,-4 C4,-10 6,-20 0,-32 C-6,-20 -4,-10 0,-4 Z"
              fill="url(#flameInner)"
              animate={{ scaleX: [1, 0.88, 1.08, 0.94, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            />
          </motion.g>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSmoke && (
          <motion.g initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[0, 1, 2, 3].map((i) => (
              <motion.circle
                key={i}
                cx={0}
                cy={0}
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

function CakeSVG({ phase, showSmoke }: { phase: string; showSmoke: boolean }) {
  const waiting = phase === "waiting";
  const flameVisible = phase !== "blown" && phase !== "done";

  return (
    <motion.div
      style={{ position: "relative", width: "100%", height: "100%" }}
      animate={waiting ? { y: [0, -4, 0] } : {}}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: "72%",
          height: 14,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.32)",
          filter: "blur(8px)",
        }}
      />

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="side1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f5deb3" />
            <stop offset="40%" stopColor="#fff8f0" />
            <stop offset="100%" stopColor="#d4a96a" />
          </linearGradient>
          <linearGradient id="side2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fce8c8" />
            <stop offset="40%" stopColor="#fff8f0" />
            <stop offset="100%" stopColor="#dbb87a" />
          </linearGradient>
          <radialGradient id="topFace" cx="42%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#fff4e0" />
            <stop offset="100%" stopColor="#f0d9a8" />
          </radialGradient>
          <radialGradient id="midFace" cx="42%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#fff4e0" />
            <stop offset="100%" stopColor="#f0d9a8" />
          </radialGradient>
          <linearGradient id="cream1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffb8c8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ffd6e0" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#f0909a" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="candleGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e8e8e8" />
            <stop offset="35%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#c0c0c0" />
          </linearGradient>
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
          <radialGradient id="wickGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffe090" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffcc40" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="roseGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fce4ec" />
          </radialGradient>
        </defs>

        <path d="M20 118 L20 142 Q90 158 160 142 L160 118 Q90 134 20 118Z" fill="url(#side1)" />
        <ellipse cx="90" cy="142" rx="70" ry="10" fill="#d4a96a" opacity="0.5" />
        <ellipse cx="90" cy="118" rx="70" ry="11" fill="url(#topFace)" />
        <ellipse cx="72" cy="113" rx="28" ry="5" fill="rgba(255,255,255,0.45)" />

        <path d="M20 108 L20 118 Q90 134 160 118 L160 108 Q90 124 20 108Z" fill="url(#cream1)" />
        <path
          d="M20 108 Q32 103, 44 108 Q56 113, 68 108 Q80 103, 92 108 Q104 113, 116 108 Q128 103, 140 108 Q152 113, 160 108"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.5"
          fill="none"
        />

        <path d="M30 82 L30 108 Q90 122 150 108 L150 82 Q90 96 30 82Z" fill="url(#side2)" />
        <ellipse cx="90" cy="108" rx="60" ry="9" fill="#dbb87a" opacity="0.4" />
        <ellipse cx="90" cy="82" rx="60" ry="10" fill="url(#midFace)" />
        <ellipse cx="76" cy="78" rx="22" ry="4" fill="rgba(255,255,255,0.5)" />

        <ellipse cx="62" cy="79" rx="7" ry="4.5" fill="url(#roseGrad)" />
        <ellipse cx="62" cy="77" rx="5" ry="3" fill="rgba(255,255,255,0.8)" />
        <ellipse cx="118" cy="79" rx="7" ry="4.5" fill="url(#roseGrad)" />
        <ellipse cx="118" cy="77" rx="5" ry="3" fill="rgba(255,255,255,0.8)" />
        <circle cx="62" cy="108" r="4" fill="#e05060" opacity="0.85" />
        <circle cx="118" cy="108" r="4" fill="#e05060" opacity="0.85" />
        <circle cx="90" cy="112" r="3.5" fill="#e05060" opacity="0.75" />
        <circle cx="60.5" cy="106.5" r="1.2" fill="rgba(255,255,255,0.7)" />
        <circle cx="116.5" cy="106.5" r="1.2" fill="rgba(255,255,255,0.7)" />

        <rect x="84" y="46" width="12" height="36" rx="3" fill="url(#candleGrad)" />
        <rect x="91" y="46" width="5" height="36" rx="2" fill="rgba(160,140,120,0.25)" />
        <ellipse cx="90" cy="48" rx="7" ry="3.5" fill="#ffffff" opacity="0.9" />
        <path d="M86 49 Q84 54, 83 60" stroke="#f0e0c0" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
        <line x1="90" y1="38" x2="90" y2="47" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
        <ellipse cx="90" cy="47" rx="4" ry="2" fill="url(#wickGlow)" />

        <FlameSVG visible={flameVisible} showSmoke={showSmoke} />

        <path d="M20 118 Q90 134 160 118" stroke="rgba(180,140,90,0.25)" strokeWidth="0.8" fill="none" />
        <path d="M20 142 Q90 158 160 142" stroke="rgba(160,120,70,0.2)" strokeWidth="0.8" fill="none" />
        <path d="M30 82 Q90 96 150 82" stroke="rgba(180,140,90,0.2)" strokeWidth="0.8" fill="none" />
      </svg>
    </motion.div>
  );
}

export function Scene4_5Candle({ onBlown, onEnter, onExiting, onMicEnded, onMicPromptChange }: Scene4_5CandleProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window ||
      (typeof window.matchMedia === "function" &&
        window.matchMedia("(hover: none) and (pointer: coarse)").matches));
  const [phase, setPhase] = useState<"idle" | "subtitles" | "waiting" | "blown" | "done">("idle");
  const [visibleLines, setVisibleLines] = useState(0);
  const [showSmoke, setShowSmoke] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showMicNotice, setShowMicNotice] = useState(false);
  const [micMode, setMicMode] = useState<"pending" | "enabled" | "skipped">(() => {
    if (typeof window === "undefined") return "enabled";
    return "ontouchstart" in window ||
      (typeof window.matchMedia === "function" &&
        window.matchMedia("(hover: none) and (pointer: coarse)").matches)
      ? "pending"
      : "enabled";
  });
  const hasEnteredRef = useRef(false);
  const hasBlownRef = useRef(false);
  const hasExitedRef = useRef(false);
  const micDetectionStartedRef = useRef(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const onEnterRef = useRef(onEnter);
  const onBlownRef = useRef(onBlown);
  const onExitingRef = useRef(onExiting);
  const onMicEndedRef = useRef(onMicEnded);
  const onMicPromptChangeRef = useRef(onMicPromptChange);

  useEffect(() => {
    onEnterRef.current = onEnter;
    onBlownRef.current = onBlown;
    onExitingRef.current = onExiting;
    onMicEndedRef.current = onMicEnded;
    onMicPromptChangeRef.current = onMicPromptChange;
  }, [onEnter, onBlown, onExiting, onMicEnded, onMicPromptChange]);

  const triggerBlown = useCallback(() => {
    if (hasBlownRef.current) return;
    hasBlownRef.current = true;
    micDetectionStartedRef.current = false;
    cancelAnimationFrame(animFrameRef.current);
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    onMicEndedRef.current?.();
    setPhase("blown");
    setShowHint(false);
    setShowMicNotice(false);
    setShowSmoke(true);
    window.setTimeout(() => {
      setShowSmoke(false);
      setPhase("done");
    }, 1400);
  }, []);

  const startMicDetection = useCallback(async () => {
    if (micDetectionStartedRef.current || hasBlownRef.current || micMode === "skipped") return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicMode("skipped");
      return;
    }
    micDetectionStartedRef.current = true;
    onMicPromptChangeRef.current?.(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      onMicPromptChangeRef.current?.(false);
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const samples = new Uint8Array(analyser.frequencyBinCount);
      let loudCount = 0;

      const check = () => {
        if (hasBlownRef.current) return;
        analyser.getByteFrequencyData(samples);
        const avg = samples.reduce((sum, value) => sum + value, 0) / samples.length;
        if (avg > 52) {
          loudCount += 1;
          if (loudCount >= 3) {
            triggerBlown();
            stream.getTracks().forEach((track) => track.stop());
            micStreamRef.current = null;
            void ctx.close();
            return;
          }
        } else {
          loudCount = 0;
        }
        animFrameRef.current = requestAnimationFrame(check);
      };

      animFrameRef.current = requestAnimationFrame(check);
    } catch {
      onMicPromptChangeRef.current?.(false);
      micDetectionStartedRef.current = false;
      setMicMode("skipped");
      // Keep tap-to-blow as the fallback when mic permission is unavailable.
    }
  }, [micMode, triggerBlown]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const scrollRoot = el.closest(".scroll-snap-y");
    const triggerEnter = () => {
      if (hasEnteredRef.current || hasBlownRef.current || hasExitedRef.current || phase !== "idle") return;
      hasEnteredRef.current = true;
      onEnterRef.current();
      window.setTimeout(() => setPhase("subtitles"), 800);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.62) {
          triggerEnter();
        }
      },
      {
        root: scrollRoot instanceof Element ? scrollRoot : null,
        threshold: [0.42, 0.62, 0.82],
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [phase]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || phase === "done") return;
    let touchStartY = 0;

    const onWheel = (event: WheelEvent) => {
      if (hasEnteredRef.current && !hasBlownRef.current && event.deltaY > 0) {
        event.preventDefault();
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!hasEnteredRef.current || hasBlownRef.current) return;
      if (touchStartY - event.touches[0].clientY > 0) {
        event.preventDefault();
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
  }, [phase]);

  useEffect(() => {
    if (phase !== "subtitles") return;
    let idx = 0;
    const timers: number[] = [];

    const showNext = () => {
      idx += 1;
      setVisibleLines(idx);
      if (idx === LINES.length) {
        setPhase("waiting");
        setShowHint(false);
        if (isTouchDevice && micMode === "pending") {
          setShowMicNotice(true);
        }
      } else {
        timers.push(window.setTimeout(showNext, 700));
      }
    };

    timers.push(window.setTimeout(showNext, 400));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isTouchDevice, micMode, phase]);

  useEffect(() => {
    if (phase !== "waiting" || showMicNotice) return;
    const timers: number[] = [];
    if (micMode === "enabled") {
      timers.push(
        window.setTimeout(() => {
          void startMicDetection();
        }, 0)
      );
    }
    timers.push(window.setTimeout(() => setShowHint(true), 600));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [micMode, phase, showMicNotice, startMicDetection]);

  useEffect(() => {
    return () => {
      onMicPromptChangeRef.current?.(false);
      micDetectionStartedRef.current = false;
      cancelAnimationFrame(animFrameRef.current);
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    };
  }, []);

  const handleEnableMic = useCallback(() => {
    setShowMicNotice(false);
    setMicMode("enabled");
  }, []);

  const handleCloseMicNotice = useCallback(() => {
    setShowMicNotice(false);
    setMicMode("enabled");
  }, []);

  const handleSkipMic = useCallback(() => {
    setShowMicNotice(false);
    setMicMode("skipped");
  }, []);

  useEffect(() => {
    // 吹完蜡烛后（blown 或 done 阶段）就开始监听离屏，不等烟雾动画结束
    if (phase !== "blown" && phase !== "done") return;
    const el = sectionRef.current;
    if (!el) return;

    const triggerExit = () => {
      if (hasExitedRef.current) return;
      hasExitedRef.current = true;
      onBlownRef.current();
    };
    const triggerExitWithSong = () => {
      onExitingRef.current?.();
      triggerExit();
    };

    const isTouchDevice =
      typeof window !== "undefined" &&
      ("ontouchstart" in window ||
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(hover: none) and (pointer: coarse)").matches));

    if (isTouchDevice) {
      // 移动端：主动轮询蛋糕幕位置，不依赖任何事件
      // scroll-snap 滑动时 touchmove/scroll 事件均不可靠，轮询是唯一稳定方案
      const poll = window.setInterval(() => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          triggerExitWithSong();
        }
      }, 200);
      return () => { window.clearInterval(poll); };
    } else {
      // 桌面端：wheel 事件已足够可靠，保持不变
      const onWheel = (event: WheelEvent) => {
        if (event.deltaY > 0) triggerExitWithSong();
      };
      el.addEventListener("wheel", onWheel, { passive: true });
      return () => { el.removeEventListener("wheel", onWheel); };
    }
  }, [phase]);

  return (
    <section
      ref={sectionRef}
      className="scroll-snap-start"
      style={{
        zIndex: 10,
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: phase === "done" ? "auto" : "none",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(1.6rem, 5vw, 2.8rem)" }}>
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
          onClick={() => {
            if (phase === "waiting") triggerBlown();
          }}
          whileHover={phase === "waiting" ? { scale: 1.04 } : {}}
          whileTap={phase === "waiting" ? { scale: 0.96 } : {}}
        >
          <CakeSVG phase={phase} showSmoke={showSmoke} />

          {phase === "waiting" && (
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,210,80,0.09) 0%, transparent 70%)",
                transform: "scale(1.4)",
                pointerEvents: "none",
              }}
              animate={{ scale: [1.4, 2.0, 1.4], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", minHeight: "6rem" }}>
          {LINES.map((line, index) => (
            <motion.p
              key={index}
              className="font-light select-none"
              style={{
                fontSize: "clamp(0.9rem, 2.5vw, 1.3rem)",
                letterSpacing: "0.25em",
                color: index === LINES.length - 1 ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.65)",
                lineHeight: 1.8,
                margin: 0,
                opacity: visibleLines > index ? 1 : 0,
                transform: visibleLines > index ? "translateY(0)" : "translateY(10px)",
                transition:
                  visibleLines > index
                    ? "opacity 0.8s ease, transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)"
                    : "none",
              }}
            >
              {line}
            </motion.p>
          ))}
        </div>

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
                style={{
                  display: "none",
                  fontSize: "clamp(0.72rem, 1.4vw, 0.9rem)",
                  letterSpacing: "0.35em",
                  color: "rgba(255,255,255,0.75)",
                  fontWeight: 500,
                }}
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                对着屏幕吹一口气
              </motion.span>
              <motion.span
                style={{
                  fontSize: "clamp(0.72rem, 1.4vw, 0.9rem)",
                  letterSpacing: "0.35em",
                  color: "rgba(255,255,255,0.75)",
                  fontWeight: 500,
                }}
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                {micMode === "skipped" ? "轻触蜡烛让它熄灭" : "对着屏幕吹一口气"}
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
                style={{
                  fontSize: "clamp(0.72rem, 1.4vw, 0.9rem)",
                  letterSpacing: "0.35em",
                  color: "rgba(255,255,255,0.75)",
                }}
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

        <AnimatePresence>
          {showMicNotice && (
            <motion.div
              key="mic-notice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "clamp(1rem, 4vw, 1.5rem)",
                background: "rgba(6,6,10,0.38)",
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 12, scale: 0.98, filter: "blur(6px)" }}
                transition={{ ...springGentle }}
                style={{
                  position: "relative",
                  width: "min(26rem, 100%)",
                  padding: "1.15rem 1rem 1rem",
                  borderRadius: "1.35rem",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.07) 100%)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  boxShadow: "0 18px 54px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <button
                  type="button"
                  aria-label="关闭麦克风提示"
                  onClick={handleCloseMicNotice}
                  style={{
                    position: "absolute",
                    top: "0.7rem",
                    right: "0.7rem",
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.78)",
                    fontSize: "1rem",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", paddingRight: "2rem" }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "clamp(0.96rem, 3.2vw, 1.05rem)",
                        letterSpacing: "0.12em",
                        color: "rgba(255,255,255,0.9)",
                      }}
                    >
                      即将开启麦克风
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "clamp(0.76rem, 2.8vw, 0.88rem)",
                        lineHeight: 1.75,
                        letterSpacing: "0.06em",
                        color: "rgba(255,255,255,0.68)",
                      }}
                    >
                      开启麦克风后可以吹灭蜡烛，但请注意音量变化，因系统限制会强制开启扬声器；如不方便，也可以轻触蜡烛让它熄灭。
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleEnableMic}
                      style={{
                        flex: "1 1 10rem",
                        minHeight: "2.75rem",
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.92)",
                        letterSpacing: "0.14em",
                        fontSize: "0.82rem",
                      }}
                    >
                      继续开启
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipMic}
                      style={{
                        flex: "1 1 10rem",
                        minHeight: "2.75rem",
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.7)",
                        letterSpacing: "0.12em",
                        fontSize: "0.8rem",
                      }}
                    >
                      改为轻触蜡烛
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
