"use client";
import { useEffect, useRef, useState, useCallback, type MutableRefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springGentle } from "@/lib/animationPresets";

interface Scene5LetterProps {
  sectionRef?: MutableRefObject<HTMLElement | null>;
  giftLetter: string;
  letterAlign?: "left" | "center" | "right";
  hasPhotos?: boolean;
  started?: boolean;
  onLetterDone?: () => void;
  screenshotMode?: boolean; // 截图模式：强制显示全部文字，不裁剪
}

export function Scene5Letter({
  sectionRef,
  giftLetter,
  letterAlign = "center",
  hasPhotos = false,
  started = false,
  onLetterDone,
  screenshotMode = false,
}: Scene5LetterProps) {
  const internalSectionRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const inViewRef = useRef(false);
  const isCenteredMode = useRef(false);
  const startedRef = useRef(false);
  const completionTriggeredRef = useRef(false);
  const lineTimersRef = useRef<number[]>([]);
  const completionTimerRef = useRef<number | null>(null);

  const [letterDone, setLetterDone] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  const paragraphs = giftLetter
    .split("\n\n")
    .map((paragraph) => paragraph.split("\n").filter((line) => line.trim() !== ""))
    .filter((paragraph) => paragraph.length > 0);

  const allLines: { text: string; paraIdx: number; lineIdx: number }[] = [];
  paragraphs.forEach((paragraph, paraIdx) => {
    paragraph.forEach((line, lineIdx) => {
      allLines.push({ text: line, paraIdx, lineIdx });
    });
  });

  const totalLines = allLines.length;
  const LINE_INTERVAL = 780;
  const fontSize = "clamp(1rem, 2.8vw, 1.4rem)";

  const recalcTranslate = useCallback((count: number) => {
    if (!clipRef.current || !containerRef.current || count === 0 || isCenteredMode.current) return;
    const clipHeight = clipRef.current.getBoundingClientRect().height;
    const lastRow = rowRefs.current[count - 1];
    if (!lastRow) return;

    const containerTop = containerRef.current.getBoundingClientRect().top;
    const rowBottom = lastRow.getBoundingClientRect().bottom;
    const contentBottom = rowBottom - containerTop;
    const overflow = contentBottom - clipHeight;
    if (overflow > 0) {
      setTranslateY(-overflow);
    }
  }, []);

  const handleLastLineDone = useCallback(() => {
    if (completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;
    setLetterDone(true);

    if (inViewRef.current) {
      if (hasPhotos && onLetterDone) {
        window.setTimeout(() => onLetterDone(), 1200);
      } else {
        window.setTimeout(() => setShowScrollHint(true), 800);
      }
    } else {
      setShowScrollHint(true);
    }
  }, [hasPhotos, onLetterDone]);

  useEffect(() => {
    if (!started || startedRef.current) return;
    startedRef.current = true;
    completionTriggeredRef.current = false;
    setVisibleCount(0);
    setLetterDone(false);
    setShowScrollHint(false);

    const setupTimer = window.setTimeout(() => {
      if (containerRef.current && clipRef.current) {
        const contentHeight = containerRef.current.scrollHeight;
        const clipHeight = clipRef.current.clientHeight;
        if (contentHeight <= clipHeight) {
          isCenteredMode.current = true;
          setTranslateY((clipHeight - contentHeight) / 2);
        }
      }

      if (totalLines === 0) {
        completionTimerRef.current = window.setTimeout(handleLastLineDone, 300);
        return;
      }

      Array.from({ length: totalLines }).forEach((_, index) => {
        const timer = window.setTimeout(() => {
          setVisibleCount(index + 1);
        }, index * LINE_INTERVAL);
        lineTimersRef.current.push(timer);
      });

      const completionDelay = Math.max(950, (totalLines - 1) * LINE_INTERVAL + 950);
      completionTimerRef.current = window.setTimeout(handleLastLineDone, completionDelay);
    }, 120);

    return () => {
      window.clearTimeout(setupTimer);
      lineTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      lineTimersRef.current = [];
      if (completionTimerRef.current) {
        window.clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
    };
  }, [started, totalLines, handleLastLineDone]);

  useEffect(() => {
    if (visibleCount === 0) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        recalcTranslate(visibleCount);
      });
    });
  }, [visibleCount, recalcTranslate]);

  useEffect(() => {
    const el = internalSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (letterDone) return;
    const el = internalSectionRef.current;
    if (!el) return;

    const preventWheelDown = (event: WheelEvent) => {
      if (event.deltaY > 0) event.stopPropagation();
    };

    let touchStartY = 0;
    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0].clientY;
    };

    const preventTouchDown = (event: TouchEvent) => {
      if (touchStartY - event.touches[0].clientY > 0) {
        event.stopPropagation();
      }
    };

    el.addEventListener("wheel", preventWheelDown, { capture: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", preventTouchDown, { capture: true });
    return () => {
      el.removeEventListener("wheel", preventWheelDown, { capture: true });
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", preventTouchDown, { capture: true });
    };
  }, [letterDone]);

  useEffect(() => {
    if (letterDone) return;
    const el = clipRef.current;
    if (!el) return;
    const block = (event: Event) => event.preventDefault();
    el.addEventListener("wheel", block, { passive: false });
    el.addEventListener("touchmove", block, { passive: false });
    return () => {
      el.removeEventListener("wheel", block);
      el.removeEventListener("touchmove", block);
    };
  }, [letterDone]);

  useEffect(() => {
    if (!letterDone || isCenteredMode.current) return;
    const inner = scrollRef.current;
    if (!inner) return;
    requestAnimationFrame(() => {
      inner.scrollTop = Math.abs(translateY);
    });
  }, [letterDone, translateY]);

  return (
    <section
      ref={(node) => {
        internalSectionRef.current = node;
        if (sectionRef) sectionRef.current = node;
      }}
      className="scroll-snap-start"
      style={{ zIndex: 10, height: screenshotMode ? "auto" : "100dvh", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}
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
        <motion.div
          style={{
            width: "1px",
            height: "40px",
            background: "rgba(255,255,255,0.1)",
            marginBottom: "1.5rem",
            flexShrink: 0,
            alignSelf: "center",
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ ...springGentle, delay: 0.1 }}
        />

        <div
          ref={clipRef}
          style={{
            flex: 1,
            overflow: screenshotMode ? "visible" : "hidden",
            position: "relative",
          }}
        >
          <div
            ref={scrollRef}
            style={{
              position: screenshotMode ? "relative" : "absolute",
              inset: screenshotMode ? undefined : 0,
              overflowY: screenshotMode ? "visible" : (letterDone ? "auto" : "hidden"),
              overflowX: screenshotMode ? "visible" : "hidden",
              scrollbarWidth: letterDone ? "thin" : "none",
              scrollbarColor: "rgba(255,255,255,0.12) transparent",
            }}
          >
            <div
              ref={containerRef}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.6rem",
                width: "100%",
                alignItems:
                  letterAlign === "left"
                    ? "flex-start"
                    : letterAlign === "right"
                      ? "flex-end"
                      : "center",
                textAlign: letterAlign,
                paddingBottom: "0.5rem",
                transform: (screenshotMode || (letterDone && !isCenteredMode.current)) ? "translateY(0)" : `translateY(${translateY}px)`,
                transition: letterDone ? "none" : "transform 0.85s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                willChange: "transform",
              }}
            >
              {(() => {
                let rowIndex = 0;
                return paragraphs.map((paragraph, paraIdx) => (
                  <div
                    key={paraIdx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.55rem",
                      alignItems:
                        letterAlign === "left"
                          ? "flex-start"
                          : letterAlign === "right"
                            ? "flex-end"
                            : "center",
                      width: "100%",
                    }}
                  >
                    {paragraph.map((line, lineIdx) => {
                      const currentRow = rowIndex++;
                      const visible = screenshotMode || currentRow < visibleCount;
                      return (
                        <p
                          key={`${paraIdx}-${lineIdx}`}
                          ref={(node) => {
                            rowRefs.current[currentRow] = node;
                          }}
                          className="font-light select-none"
                          style={{
                            fontSize,
                            letterSpacing: "0.18em",
                            color: "rgba(255,255,255,0.75)",
                            lineHeight: 1.9,
                            margin: 0,
                            opacity: visible ? 1 : 0,
                            transform: visible ? "translateY(0)" : "translateY(10px)",
                            transition:
                              visible
                                ? "opacity 0.9s ease, transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                                : "none",
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

        <div
          style={{
            flexShrink: 0,
            alignSelf: "center",
            marginTop: "1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
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
                  style={{
                    fontSize: "clamp(0.72rem, 1.4vw, 0.9rem)",
                    letterSpacing: "0.35em",
                    color: "rgba(255,255,255,0.75)",
                  }}
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
