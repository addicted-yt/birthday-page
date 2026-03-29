"use client";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
  TargetAndTransition,
} from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import { CardPhoto } from "@/types/birthday";
import { springGentle } from "@/lib/animationPresets";

// ─── 展开态浮层 ──────────────────────────────────────────────────────
interface ExpandedOverlayProps {
  photo: CardPhoto;
  index: number;
  onCollapse: () => void;
  onCollapseToFan: () => void;
}

const expandSpring = { type: "spring" as const, damping: 26, stiffness: 220, mass: 0.9 };

function captionFontSize(size?: CardPhoto["captionSize"]) {
  switch (size) {
    case "xs":  return "clamp(0.55rem, 1.4vw, 0.65rem)";
    case "sm":  return "clamp(0.62rem, 1.6vw, 0.75rem)";
    case "md":  return "clamp(0.7rem, 2vw, 0.85rem)";
    case "lg":  return "clamp(0.82rem, 2.3vw, 1rem)";
    case "xl":  return "clamp(0.95rem, 2.7vw, 1.15rem)";
    case "2xl": return "clamp(1.1rem, 3.2vw, 1.4rem)";
    default:    return "clamp(0.7rem, 2vw, 0.85rem)";
  }
}

function CaptionLayer({ photo, bright }: { photo: CardPhoto; bright: boolean }) {
  if (!photo.caption) return null;
  const pos = photo.captionPosition ?? "bottom";
  const align = photo.captionAlign ?? "center";
  const isGeorgia = photo.captionFont === "georgia";
  const posStyle: React.CSSProperties =
    pos === "top"
      ? { top: 0, bottom: "auto", paddingTop: "clamp(0.8rem,2.5vh,1.2rem)", paddingBottom: 0 }
      : pos === "center"
      ? { top: "50%", bottom: "auto", transform: "translateY(-50%)", paddingBottom: 0 }
      : { bottom: 0, paddingBottom: "clamp(0.8rem,2.5vh,1.2rem)" };
  const padStyle: React.CSSProperties =
    align === "left"
      ? { paddingLeft: "1rem", paddingRight: "2rem" }
      : align === "right"
      ? { paddingLeft: "2rem", paddingRight: "1rem" }
      : { paddingLeft: "1rem", paddingRight: "1rem" };
  return (
    <p
      className="absolute left-0 right-0 select-none"
      style={{
        fontSize: isGeorgia ? "11px" : captionFontSize(photo.captionSize),
        fontFamily: isGeorgia ? "Georgia, serif" : undefined,
        fontStyle: isGeorgia ? "italic" : undefined,
        fontWeight: isGeorgia ? "normal" : 300,
        letterSpacing: isGeorgia ? "0.12em" : "0.15em",
        color: bright ? (photo.captionColor ?? "rgba(255,255,255,0.90)") : isGeorgia ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.22)",
        transition: "color 0.6s ease",
        whiteSpace: "pre-line",
        wordBreak: "break-all",
        lineHeight: 1.5,
        textAlign: align,
        ...padStyle,
        ...posStyle,
      }}
    >
      {photo.caption}
    </p>
  );
}

// 展开态专用：caption 带 Framer Motion 浮现动画
function CaptionLayerAnimated({ photo }: { photo: CardPhoto }) {
  if (!photo.caption) return null;
  const pos = photo.captionPosition ?? "bottom";
  const align = photo.captionAlign ?? "center";
  const isGeorgia = photo.captionFont === "georgia";
  const posStyle: React.CSSProperties =
    pos === "top"
      ? { top: 0, bottom: "auto", paddingTop: "clamp(0.8rem,2.5vh,1.2rem)", paddingBottom: 0 }
      : pos === "center"
      ? { top: "50%", bottom: "auto", transform: "translateY(-50%)", paddingBottom: 0 }
      : { bottom: 0, paddingBottom: "clamp(0.8rem,2.5vh,1.2rem)" };
  const padStyle: React.CSSProperties =
    align === "left"
      ? { paddingLeft: "1rem", paddingRight: "2rem" }
      : align === "right"
      ? { paddingLeft: "2rem", paddingRight: "1rem" }
      : { paddingLeft: "1rem", paddingRight: "1rem" };
  return (
    <motion.p
      className="absolute left-0 right-0 select-none"
      style={{
        fontSize: isGeorgia ? "11px" : captionFontSize(photo.captionSize),
        fontFamily: isGeorgia ? "Georgia, serif" : undefined,
        fontStyle: isGeorgia ? "italic" : undefined,
        fontWeight: isGeorgia ? "normal" : 300,
        letterSpacing: isGeorgia ? "0.12em" : "0.15em",
        color: photo.captionColor ?? "rgba(255,255,255,0.90)",
        whiteSpace: "pre-line",
        wordBreak: "break-all",
        lineHeight: 1.5,
        textAlign: align,
        ...padStyle,
        ...posStyle,
      }}
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...springGentle, delay: 0.32 }}
    >
      {photo.caption}
    </motion.p>
  );
}

function CardFace({ photo, index }: { photo: CardPhoto; index: number }) {
  return (
    <>
      {photo.dataUrl ? (
        <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div
          className="w-full h-full"
          style={{
            background: [
              "linear-gradient(145deg, #1a1f3a 0%, #0d1020 100%)",
              "linear-gradient(145deg, #1f1a35 0%, #100d20 100%)",
              "linear-gradient(145deg, #1a2535 0%, #0d1520 100%)",
              "linear-gradient(145deg, #251a30 0%, #150d1c 100%)",
              "linear-gradient(145deg, #1a2530 0%, #0d1620 100%)",
            ][index % 5],
          }}
        />
      )}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: "45%", background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)" }}
      />
    </>
  );
}

function ExpandedOverlay({ photo, index, onCollapse, onCollapseToFan }: ExpandedOverlayProps) {
  return (
    <>
      <motion.div
        className="fixed inset-0 z-[99]"
        style={{ background: "rgba(0,0,8,0.88)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45 }}
        onClick={onCollapseToFan}
      />
      <motion.div
        className="fixed z-[100]"
        style={{ width: "min(340px, 80vw, 60dvh)", aspectRatio: "4/5", top: "50%", left: "50%" }}
        initial={{ x: "-50%", y: "-50%", scale: 0.7, opacity: 0, filter: "blur(14px)", rotate: -3 }}
        animate={{ x: "-50%", y: "-50%", scale: 1, opacity: 1, filter: "blur(0px)", rotate: 0 }}
        exit={{ x: "-50%", y: "-38%", scale: 0.82, opacity: 0, filter: "blur(6px)", rotate: 2 }}
        transition={expandSpring}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full h-full rounded-2xl overflow-hidden relative"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            boxShadow: "0 24px 72px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <CardFace photo={photo} index={index} />
          <CaptionLayerAnimated photo={photo} />
        </div>
        <motion.button
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white/60 text-base"
          style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.14)" }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ delay: 0.2, duration: 0.18 }}
          onClick={(e) => { e.stopPropagation(); onCollapse(); }}
          whileTap={{ scale: 0.82 }}
        >
          ×
        </motion.button>
      </motion.div>
    </>
  );
}

// ─── CardItem ──────────────────────────────────────────────────────
interface CardItemProps {
  photo: CardPhoto;
  index: number;
  total: number;
  isHovered: boolean;
  expandedX: number;
  expandedY: number;
  expandedRotate: number;
  captionBright: boolean;
  isMobile: boolean;
  onExpand: () => void;
}

function CardItem({
  photo, index, total, isHovered,
  expandedX, expandedY, expandedRotate,
  captionBright, isMobile, onExpand,
}: CardItemProps) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 120, damping: 20 });
  const springY = useSpring(rawY, { stiffness: 120, damping: 20 });
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [5, -5]);

  const zIndex = 20 + index;
  const baseRotate = (index - (total - 1) / 2) * 5;

  // 移动端：区分 tap 和 swipe，swipe 不触发展开；长按触发展开
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isTap = useRef(true);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if ("ontouchstart" in window) {
      // 移动端：阻止冒泡（避免触发容器 toggle），直接展开大图
      e.stopPropagation();
      if (!isTap.current) return;
    }
    onExpand();
  }, [onExpand]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [rawX, rawY]);

  const handleMouseLeave = useCallback(() => {
    rawX.set(0); rawY.set(0);
  }, [rawX, rawY]);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStartCard = useCallback((e: React.TouchEvent) => {
    e.stopPropagation(); // 阻止冒泡到容器，防止 toggle 扇形
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isTap.current = true;
  }, []);

  const handleTouchMoveCard = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) {
      isTap.current = false;
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    }
  }, []);

  const handleTouchEndCard = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  }, []);
  const animateState: TargetAndTransition = isHovered
    ? { x: expandedX, y: expandedY, rotate: expandedRotate, scale: 1.03 }
    : { x: 0, y: 0, rotate: baseRotate, scale: 1 };

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{ width: isMobile ? "min(160px, 42vw)" : "min(240px, 58vw)", aspectRatio: "4/5", zIndex }}
      animate={animateState}
      transition={springGentle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onTouchStart={handleTouchStartCard}
      onTouchMove={handleTouchMoveCard}
      onTouchEnd={handleTouchEndCard}
      onTouchCancel={handleTouchEndCard}
    >
      <motion.div
        className="w-full h-full rounded-2xl overflow-hidden relative"
        style={{
          rotateX, rotateY, transformPerspective: 900,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          boxShadow: "0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <CardFace photo={photo} index={index} />
        <CaptionLayer photo={photo} bright={captionBright} />
      </motion.div>
    </motion.div>
  );
}

// ─── Scene3Cards ────────────────────────────────────────────────────
interface Scene3CardsProps {
  cardPhotos: CardPhoto[];
}

export function Scene3Cards({ cardPhotos }: Scene3CardsProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  // 用 ref 存储已点开过的卡片索引，避免 Set 在频繁重渲染中读到旧值
  const brightSetRef = useRef<Set<number>>(new Set());
  const [brightRevision, setBrightRevision] = useState(0);
  const [containerW, setContainerW] = useState(0);
  const [isMobileDevice] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  });
  const touchRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // 移动端：记录触摸起点，用于区分点击和滑动
  const containerTouchStart = useRef<{ x: number; y: number } | null>(null);

  // 监听容器宽度
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width);
    });
    obs.observe(el);
    setContainerW(el.getBoundingClientRect().width);
    return () => obs.disconnect();
  }, []);

  // 扇形展开：动态间距，移动端卡片更小以适应屏幕
  const getExpandedProps = (i: number, total: number) => {
    const center = (total - 1) / 2;
    const offset = i - center;
    const isMobile = typeof window !== "undefined" && window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    // 移动端：最大宽度 160px，系数 0.42；桌面：最大 240px，系数 0.58
    const cardW = isMobile
      ? Math.min(160, containerW * 0.42)
      : Math.min(240, containerW * 0.58);
    const usable = containerW - cardW - 40;
    const maxSpacing = total > 1 ? usable / (total - 1) : 0;
    const spacing = Math.min(isMobile ? 140 : 200, maxSpacing);
    const expandedX = offset * spacing;
    const rotDeg = offset * 6;
    const expandedY = Math.abs(rotDeg) * 1.8;
    return { expandedX, expandedY, expandedRotate: rotDeg };
  };

  const handleExpand = (i: number) => {
    setExpandedIndex(i);
    brightSetRef.current.add(i);
    setBrightRevision((v) => v + 1); // 触发重渲染使 captionBright 更新
  };

  const toggleFan = () => {
    touchRef.current = true;
    setIsHovered((v) => !v);
  };

  const handleContainerTouchStart = (e: React.TouchEvent) => {
    containerTouchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleContainerTouchEnd = (e: React.TouchEvent) => {
    if (!containerTouchStart.current) return;
    const t = e.changedTouches[0];
    const dx = Math.abs(t.clientX - containerTouchStart.current.x);
    const dy = Math.abs(t.clientY - containerTouchStart.current.y);
    containerTouchStart.current = null;

    // 上下滑动超过 10px → 是翻页手势，不触发展开
    if (dy > 16) return;
    // 左右位移太大也忽略
    if (dx > 34) return;

    // 判断点击位置是否在卡片叠放中心区域 ± padding 内
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = t.clientX - rect.left;
    const relY = t.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const hitW = Math.min(220, rect.width * 0.56) + 120;
    const hitH = Math.max(360, rect.height * 1.75);
    const normalizedX = (relX - cx) / (hitW / 2);
    const normalizedY = (relY - cy) / (hitH / 2);
    if (normalizedX * normalizedX + normalizedY * normalizedY > 1) return;

    toggleFan();
  };

  const expandedPhoto = expandedIndex !== null ? cardPhotos[expandedIndex] : null;

  return (
    <section
      className="scroll-snap-start flex flex-col items-center justify-center overflow-hidden"
      style={{ zIndex: 10, gap: "clamp(1.2rem,3.5vh,2rem)" }}
    >
      <AnimatePresence>
        {expandedIndex !== null && expandedPhoto && (
          <ExpandedOverlay
            key={expandedIndex}
            photo={expandedPhoto}
            index={expandedIndex}
            onCollapseToFan={() => setExpandedIndex(null)}
            onCollapse={() => {
              setExpandedIndex(null);
              touchRef.current = false;
              setIsHovered(false);
            }}
          />
        )}
      </AnimatePresence>

      <motion.p
        className="font-light select-none"
        style={{ fontSize: "clamp(0.82rem, 1.6vw, 1rem)", letterSpacing: "0.38em", color: "rgba(255,255,255,0.32)" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ ...springGentle, delay: 0.6 }}
      >
        {isMobileDevice
          ? (isHovered ? "点击卡片周围 关闭" : "点击卡片周围 展开")
          : (isHovered ? "点击查看" : "触碰展开")
        }
      </motion.p>

      <motion.div
        ref={containerRef}
        className="relative flex items-center justify-center"
        style={{ width: "min(900px, 96vw)", height: isMobileDevice ? "min(260px, 55vw)" : "min(380px, 72vw)" }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ ...springGentle, delay: 0.2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => { if (!touchRef.current) setIsHovered(false); }}
      >
        {isMobileDevice && expandedIndex === null && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(320px, 82vw)",
              height: "min(420px, 96vw)",
              zIndex: 8,
            }}
            onTouchStart={handleContainerTouchStart}
            onTouchEnd={handleContainerTouchEnd}
          />
        )}
        {cardPhotos.map((photo, i) => {
          const { expandedX, expandedY, expandedRotate } = getExpandedProps(i, cardPhotos.length);
          return (
            <CardItem
              key={i}
              photo={photo}
              index={i}
              total={cardPhotos.length}
              isHovered={isHovered && expandedIndex === null}
              expandedX={expandedX}
              expandedY={expandedY}
              expandedRotate={expandedRotate}
              captionBright={brightSetRef.current.has(i)}
              isMobile={isMobileDevice}
              onExpand={() => handleExpand(i)}
            />
          );
        })}
      </motion.div>

      {isMobileDevice && isHovered && expandedIndex === null && (
        <motion.p
          className="font-light select-none"
          style={{
            fontSize: "clamp(0.74rem, 1.5vw, 0.9rem)",
            letterSpacing: "0.26em",
            color: "rgba(255,255,255,0.28)",
            margin: 0,
          }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ ...springGentle, delay: 0.08 }}
        >
          点击卡片查看
        </motion.p>
      )}
    </section>
  );
}
