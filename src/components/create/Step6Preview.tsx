"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateFlowState, CreateStep, CardPhoto } from "@/types/birthday";
import { SpringButton } from "@/components/ui/SpringButton";
import { springGentle } from "@/lib/animationPresets";
import { getDefaultCardPlaceholders } from "@/lib/defaultCardPlaceholders";

interface Step6PreviewProps {
  state: CreateFlowState;
  onPreview: () => void;
  onBack: () => void;
  onGoToStep: (step: CreateStep) => void;
}

const STEP_LABELS: { step: CreateStep; label: string }[] = [
  { step: 1, label: "01 · 名字" },
  { step: 2, label: "02 · 卡片照片" },
  { step: 3, label: "03 · 卡片文字" },
  { step: 4, label: "04 · 祝福信" },
  { step: 5, label: "05 · 礼物图片" },
];

// 卡片内容原始设计尺寸
const CARD_W = 400;
const CARD_H = 500;

// 等比缩放卡片预览（通用）
function ScaledCardPreview({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / CARD_W);
    });
    obs.observe(el);
    setScale(el.getBoundingClientRect().width / CARD_W);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="relative w-full overflow-hidden rounded-xl"
      style={{ aspectRatio: `${CARD_W}/${CARD_H}` }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: CARD_W,
          height: CARD_H,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// 默认卡片预览条目
function DefaultCardItem({ dataUrl, phrase }: { dataUrl: string; phrase: string }) {
  return (
    <ScaledCardPreview>
      <div style={{
        width: "100%", height: "100%", position: "relative",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}>
        <img src={dataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          height: "40%",
          background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />
        {phrase && (
          <p style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            paddingBottom: "32px", paddingLeft: "16px", paddingRight: "16px",
            fontSize: "11px", fontFamily: "Georgia, serif", fontStyle: "italic",
            fontWeight: "normal", letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.80)", lineHeight: 1.5,
            whiteSpace: "pre-line", textAlign: "center", margin: 0, userSelect: "none",
          }}>
            {phrase}
          </p>
        )}
      </div>
    </ScaledCardPreview>
  );
}

// 用户照片卡片预览条目
function PhotoCardItem({ photo }: { photo: CardPhoto }) {
  const pos = photo.captionPosition ?? "bottom";
  const align = photo.captionAlign ?? "center";

  const posStyle: React.CSSProperties =
    pos === "top"
      ? { top: 0, bottom: "auto", paddingTop: "20px", paddingBottom: 0 }
      : pos === "center"
      ? { top: "50%", bottom: "auto", transform: "translateY(-50%)", paddingBottom: 0 }
      : { bottom: 0, paddingBottom: "32px" };

  const padStyle: React.CSSProperties =
    align === "left"
      ? { paddingLeft: "16px", paddingRight: "32px" }
      : align === "right"
      ? { paddingLeft: "32px", paddingRight: "16px" }
      : { paddingLeft: "16px", paddingRight: "16px" };

  function fontSizePx(size?: CardPhoto["captionSize"]): number {
    switch (size) {
      case "xs":  return 10;
      case "sm":  return 12;
      case "md":  return 14;
      case "lg":  return 16;
      case "xl":  return 18;
      case "2xl": return 22;
      default:    return 14;
    }
  }

  return (
    <ScaledCardPreview>
      <div style={{
        width: "100%", height: "100%", position: "relative",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}>
        {photo.dataUrl && (
          <img src={photo.dataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          height: "45%",
          background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />
        {photo.caption && (
          <p style={{
            position: "absolute", left: 0, right: 0,
            fontSize: fontSizePx(photo.captionSize),
            fontWeight: 300,
            letterSpacing: "0.15em",
            color: photo.captionColor ?? "rgba(255,255,255,0.92)",
            lineHeight: 1.5,
            whiteSpace: "pre-line",
            textAlign: align,
            margin: 0,
            userSelect: "none",
            ...padStyle,
            ...posStyle,
          }}>
            {photo.caption}
          </p>
        )}
      </div>
    </ScaledCardPreview>
  );
}

export function Step6Preview({ state, onPreview, onBack, onGoToStep }: Step6PreviewProps) {
  const [showSteps, setShowSteps] = useState(false);

  const hasPhotos = state.cardPhotos.length > 0;

  // 默认卡片预览数据
  const defaultCards = hasPhotos ? [] : getDefaultCardPlaceholders(state.placeholderPhrases);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <p className="tracking-[0.3em] text-white/45 mb-4" style={{ fontSize: "clamp(0.82rem, 1.6vw, 1rem)" }}>STEP 06</p>
        <h2 className="font-extralight tracking-wide text-white/92" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>准备好了</h2>
        <p className="text-white/45 mt-2 tracking-wider" style={{ fontSize: "clamp(0.75rem, 1.3vw, 0.9rem)" }}>
          送给 <span className="text-white/60">{state.name}</span> 的祝福
        </p>
      </div>

      {/* 卡片预览 */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-xs text-white/20 tracking-wider text-center">
            {hasPhotos ? "卡片" : "默认卡片"}
          </p>
          <p style={{ fontSize: "0.62rem", letterSpacing: "0.08em", color: "rgba(255,255,255,0.18)", textAlign: "center" }}>效果仅供参考，实际展示以预览页为准</p>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full">
          {hasPhotos
            ? state.cardPhotos.map((photo, i) => (
                <PhotoCardItem key={i} photo={photo} />
              ))
            : defaultCards.map(({ dataUrl, phrase }, i) => (
                <DefaultCardItem key={i} dataUrl={dataUrl} phrase={phrase} />
              ))
          }
        </div>
      </div>

      {/* 摘要 */}
      <div className="w-full bg-white/3 border border-white/8 rounded-xl p-5 space-y-3">
        <SummaryRow label="名字" value={state.name} />
        <SummaryRow label="卡片照片" value={hasPhotos ? `${state.cardPhotos.length} 张` : "默认卡片"} />
        <SummaryRow
          label="礼物图片"
          value={state.giftImages.length === 0 ? "无" : `${state.giftImages.length} 张`}
        />
      </div>

      <motion.p
        className="text-xs text-white/18 text-center tracking-wide leading-relaxed max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...springGentle, delay: 0.3 }}
      >
        预览后可以继续修改，或直接复制链接分享给 TA
      </motion.p>

      <div className="flex flex-col gap-3 w-full items-center">
        <SpringButton variant="primary" onClick={onPreview} className="w-full">
          预览效果
        </SpringButton>

        <SpringButton variant="secondary" onClick={onBack} className="w-full">
          返回
        </SpringButton>

        {/* 跳转到步骤 — 折叠/展开 */}
        <button
          onClick={() => setShowSteps((v) => !v)}
          style={{
            fontSize: "0.72rem",
            letterSpacing: "0.22em",
            color: showSteps ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.28)",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            transition: "color 0.2s ease",
            paddingTop: "0.2rem",
          }}
        >
          <span>返回指定步骤</span>
          <motion.svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            animate={{ rotate: showSteps ? 180 : 0 }}
            transition={springGentle}
          >
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {showSteps && (
            <motion.div
              className="flex flex-wrap justify-center gap-2 w-full"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={springGentle}
            >
              {STEP_LABELS.map(({ step, label }) => (
                <motion.button
                  key={step}
                  onClick={() => { setShowSteps(false); onGoToStep(step); }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.12em",
                    padding: "5px 14px",
                    borderRadius: "20px",
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/30 tracking-wider">{label}</span>
      <span className="text-sm text-white/70">{value}</span>
    </div>
  );
}
