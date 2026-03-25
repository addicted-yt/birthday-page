"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springGentle } from "@/lib/animationPresets";

interface Scene5LetterProps {
  giftLetter: string;
  letterAlign?: "left" | "center" | "right";
  hasPhotos?: boolean;
  started?: boolean;
  onLetterDone?: () => void;
}

export function Scene5Letter({
  giftLetter,
  letterAlign = "center",
  hasPhotos = false,
  started = false,
  onLetterDone,
}: Scene5LetterProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // 内容容器，用于测量行高
  const inViewRef = useRef(false);
  const [letterDone, setLetterDone] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0); // 当前已浮现的行数
  const [translateY, setTranslateY] = useState(0);     // 整体上推距离 px
  const isCenteredMode = useRef(false);                 // 内容能一屏放下时居中显示

  // 解析段落和行
  const paragraphs = giftLetter
    .split("\n\n")
    .map((p) => p.split("\n").filter((l) => l.trim() !== ""))
    .filter((p) => p.length > 0);

  // 展平行列表
  const allLines: { text: string; paraIdx: number; lineIdx: number }[] = [];
  paragraphs.forEach((para, pi) => {
    para.forEach((line, li) => {
      allLines.push({ text: line, paraIdx: pi, lineIdx: li });
    });
  });
  const totalLines = allLines.length;

  const LINE_INTERVAL = 780; // ms，每行间隔

  const fontSize =
    totalLines > 12 ? "clamp(0.82rem, 2.2vw, 1.1rem)"
    : totalLines > 8 ? "clamp(0.9rem, 2.5vw, 1.25rem)"
    : "clamp(1rem, 2.8vw, 1.4rem)";

  // 每次 visibleCount 变化，重新计算整体应上推多少
  // 思路：让"当前最新行"始终出现在容器底部附近
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const clipRef = useRef<HTMLDivElement>(null); // overflow:hidden 的裁剪容器

  const recalcTranslate = useCallback((count: number) => {
    if (!clipRef.current || count === 0) return;
    // 居中模式下不上推
    if (isCenteredMode.current) return;
    const clipH = clipRef.current.getBoundingClientRect().height;
    // 找到当前最新行的底部位置（相对于内容容器顶部）
    const lastRowEl = rowRefs.current[count - 1];
    if (!lastRowEl) return;
    const containerTop = containerRef.current?.getBoundingClientRect().top ?? 0;
    const rowBottom = lastRowEl.getBoundingClientRect().bottom;
    const contentBottom = rowBottom - containerTop; // 相对内容顶部的距离
    // 如果内容底部超出裁剪区高度，上推
    const overflow = contentBottom - clipH;
    if (overflow > 0) {
      setTranslateY(-overflow);
    }
  }, []);

  // started 变 true 后逐行定时显示
  const startedRef = useRef(false);
  useEffect(() => {
    if (!started || startedRef.current || totalLines === 0) return;
    startedRef.current = true;

    // 先等 DOM 渲染完（内容已 layout 但 opacity=0），测量总高度 vs 裁剪区高度
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (containerRef.current && clipRef.current) {
          const contentH = containerRef.current.scrollHeight;
          const clipH = clipRef.current.clientHeight;
          if (contentH <= clipH) {
            isCenteredMode.current = true;
            // 内容居中：初始 translateY = (clipH - contentH) / 2
            setTranslateY((clipH - contentH) / 2);
          }
        }
        allLines.forEach((_, i) => {
          setTimeout(() => {
            setVisibleCount(i + 1);
          }, i * LINE_INTERVAL);
        });
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, totalLines]);

  // visibleCount 变化时重新计算 translateY（等 DOM 更新后）
  useEffect(() => {
    if (visibleCount === 0) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        recalcTranslate(visibleCount);
      });
    });
  }, [visibleCount, recalcTranslate]);

  // 监测 section 是否在视口
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { inViewRef.current = entry.isIntersecting; },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // 最后一行动画完成时
  const handleLastLineDone = useCallback(() => {
    setLetterDone(true);
    if (inViewRef.current) {
      if (hasPhotos && onLetterDone) {
        setTimeout(() => onLetterDone(), 1200);
      } else {
        setTimeout(() => setShowScrollHint(true), 800);
      }
    } else {
      setShowScrollHint(true);
    }
  }, [hasPhotos, onLetterDone]);

  // 出信期间：锁定外层向下滑动
  useEffect(() => {
    if (letterDone) return;
    const el = sectionRef.current;
    if (!el) return;
    const preventDown = (e: WheelEvent) => { if (e.deltaY > 0) e.stopPropagation(); };
    let ty = 0;
    const onTS = (e: TouchEvent) => { ty = e.touches[0].clientY; };
    const preventDownT = (e: TouchEvent) => { if (ty - e.touches[0].clientY > 0) e.stopPropagation(); };
    el.addEventListener("wheel", preventDown, { capture: true });
    el.addEventListener("touchstart", onTS, { passive: true });
    el.addEventListener("touchmove", preventDownT, { capture: true });
    return () => {
      el.removeEventListener("wheel", preventDown, { capture: true });
      el.removeEventListener("touchstart", onTS);
      el.removeEventListener("touchmove", preventDownT, { capture: true });
    };
  }, [letterDone]);

  // 出信期间：锁定内层手动滚动（字幕完成后解锁，可上滑回看）
  useEffect(() => {
    if (letterDone) return;
    const el = clipRef.current;
    if (!el) return;
    const block = (e: Event) => e.preventDefault();
    el.addEventListener("wheel", block, { passive: false });
    el.addEventListener("touchmove", block, { passive: false });
    return () => {
      el.removeEventListener("wheel", block);
      el.removeEventListener("touchmove", block);
    };
  }, [letterDone]);

  // 字幕完成后：把 translateY 变成实际 scrollTop，切换为可滚动
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!letterDone) return;
    // 切换到 scrollTop 模式：重置 translateY，用 scrollTop 承接位置
    const clip = clipRef.current;
    const inner = scrollRef.current;
    if (!clip || !inner) return;
    // 居中模式下 translateY 为正（内容向下偏移），完成后无需 scrollTop
    if (!isCenteredMode.current) {
      const currentOffset = Math.abs(translateY);
      requestAnimationFrame(() => {
        inner.scrollTop = currentOffset;
      });
    }
  }, [letterDone, translateY]);

  return (
    <section
      ref={sectionRef}
      className="scroll-snap-start"
      style={{ zIndex: 10, height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        className="flex flex-col w-full"
        style={{
          maxWidth: "min(400px, 88vw)",
          height: "100%",
          paddingTop: "2.5rem",
          paddingBottom: "2.5rem",
          boxSizing: "border-box",
        }}
      >
        {/* 顶部装饰线 */}
        <motion.div
          style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.1)", marginBottom: "1.5rem", flexShrink: 0, alignSelf: "center" }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ ...springGentle, delay: 0.1 }}
        />

        {/* 裁剪容器：overflow hidden，字幕在此范围内滚动 */}
        <div
          ref={clipRef}
          style={{
            flex: 1,
            overflow: letterDone ? "hidden" : "hidden", // 切换后由内层 scrollRef 负责
            position: "relative",
          }}
        >
          {/* 字幕完成后的可滚动回看层 */}
          <div
            ref={scrollRef}
            style={{
              position: "absolute",
              inset: 0,
              overflowY: letterDone ? "auto" : "hidden",
              overflowX: "hidden",
              scrollbarWidth: letterDone ? "thin" : "none",
              scrollbarColor: "rgba(255,255,255,0.12) transparent",
            }}
          >
            {/* 内容容器：整体 translateY 上推，transition 丝滑 */}
            <div
              ref={containerRef}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.6rem",
                width: "100%",
                alignItems: letterAlign === "left" ? "flex-start" : letterAlign === "right" ? "flex-end" : "center",
                textAlign: letterAlign,
                paddingBottom: "0.5rem",
                // 字幕播放中：用 translateY 上推（或居中偏移）；完成后滚动模式归零，居中模式保持
                transform: (letterDone && !isCenteredMode.current) ? "translateY(0)" : `translateY(${translateY}px)`,
                transition: letterDone
                  ? "none"
                  : "transform 0.85s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                willChange: "transform",
              }}
            >
              {(() => {
                let rowIdx = 0;
                return paragraphs.map((para, pi) => (
                  <div
                    key={pi}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.55rem",
                      alignItems: letterAlign === "left" ? "flex-start" : letterAlign === "right" ? "flex-end" : "center",
                      width: "100%",
                    }}
                  >
                    {para.map((line, li) => {
                      const idx = rowIdx++;
                      const isLast = pi === paragraphs.length - 1 && li === para.length - 1;
                      const visible = idx < visibleCount;
                      return (
                        <p
                          key={`${pi}-${li}`}
                          ref={(el) => { rowRefs.current[idx] = el; }}
                          className="font-light select-none"
                          style={{
                            fontSize,
                            letterSpacing: "0.18em",
                            color: "rgba(255,255,255,0.75)",
                            lineHeight: 1.9,
                            margin: 0,
                            opacity: visible ? 1 : 0,
                            transform: visible ? "translateY(0)" : "translateY(10px)",
                            transition: visible
                              ? "opacity 0.9s ease, transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                              : "none",
                          }}
                          onTransitionEnd={() => {
                            if (visible && isLast) handleLastLineDone();
                          }}
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* 底部：装饰线 或 请继续下滑 */}
        <div style={{ flexShrink: 0, alignSelf: "center", marginTop: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <AnimatePresence mode="wait">
            {showScrollHint ? (
              <motion.div
                key="hint"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ ...springGentle }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}
              >
                <motion.span
                  style={{ fontSize: "clamp(0.72rem, 1.4vw, 0.9rem)", letterSpacing: "0.35em", color: "rgba(255,255,255,0.75)" }}
                  animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  请继续下滑
                </motion.span>
                <motion.div
                  style={{ width: "1px", height: "22px", background: "rgba(255,255,255,0.50)", originY: 0 }}
                  animate={{ scaleY: [0.2, 1, 0.2], opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="line"
                style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.08)" }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: letterDone ? 1 : 0, opacity: letterDone ? 1 : 0 }}
                transition={{ ...springGentle, delay: 0.3 }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
