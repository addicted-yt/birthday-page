"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardPhoto, CreateStep, PlaceholderCardStyle } from "@/types/birthday";
import { SpringButton } from "@/components/ui/SpringButton";
import { springGentle } from "@/lib/animationPresets";
import { GoToStepBar } from "./GoToStepBar";
import { BIRTHDAY_PHRASES, getDefaultCardPlaceholders } from "@/lib/defaultCardPlaceholders";

interface Step3CardTextProps {
  photos: CardPhoto[];
  onChange: (photos: CardPhoto[]) => void;
  phrases: string[] | undefined;
  onPhrasesChange: (phrases: string[]) => void;
  placeholderStyles: PlaceholderCardStyle[] | undefined;
  onStylesChange: (styles: PlaceholderCardStyle[]) => void;
  onNext: () => void;
  onBack: () => void;
  showGoToStep?: boolean;
  onGoToStep?: (step: CreateStep) => void;
}

type Position = "top" | "center" | "bottom";
type Align = "left" | "center" | "right";
type CaptionSize = CardPhoto["captionSize"];

const POSITIONS: { value: Position; label: string }[] = [
  { value: "top", label: "上" },
  { value: "center", label: "中" },
  { value: "bottom", label: "下" },
];

const ALIGNS: { value: Align; label: React.ReactNode }[] = [
  {
    value: "left",
    label: (
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
        <rect x="0" y="0" width="12" height="1.8" rx="0.9" fill="currentColor" />
        <rect x="0" y="4.1" width="8" height="1.8" rx="0.9" fill="currentColor" />
        <rect x="0" y="8.2" width="10" height="1.8" rx="0.9" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: "center",
    label: (
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
        <rect x="0" y="0" width="12" height="1.8" rx="0.9" fill="currentColor" />
        <rect x="2" y="4.1" width="8" height="1.8" rx="0.9" fill="currentColor" />
        <rect x="1" y="8.2" width="10" height="1.8" rx="0.9" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: "right",
    label: (
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
        <rect x="0" y="0" width="12" height="1.8" rx="0.9" fill="currentColor" />
        <rect x="4" y="4.1" width="8" height="1.8" rx="0.9" fill="currentColor" />
        <rect x="2" y="8.2" width="10" height="1.8" rx="0.9" fill="currentColor" />
      </svg>
    ),
  },
];

const FONT_SIZES_ROW1: { value: NonNullable<CaptionSize>; label: string }[] = [
  { value: "xs",  label: "10" },
  { value: "sm",  label: "12" },
  { value: "md",  label: "14" },
];
const FONT_SIZES_ROW2: { value: NonNullable<CaptionSize>; label: string }[] = [
  { value: "lg",  label: "16" },
  { value: "xl",  label: "18" },
  { value: "2xl", label: "22" },
];

const FIXED_COLORS = [
  { value: "rgba(255,255,255,0.92)", swatch: "#ffffff" },
  { value: "rgba(255,220,160,0.92)", swatch: "#ffdc9e" },
  { value: "rgba(200,230,255,0.92)", swatch: "#c8e5ff" },
  { value: "rgba(255,190,210,0.92)", swatch: "#ffbed2" },
];

const CUSTOM_SLOT_DEFAULTS = ["#dcc8ff", "#ffe682", "#8cdcff", "#ffa08c"];

function hexToRgba(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.92)`;
}


// 字数（不含换行符）
function charCount(s?: string) {
  return (s ?? "").replace(/\n/g, "").length;
}

const MAX_PHRASES = 3;
const MAX_CHARS = 20;

function charCountSingle(s: string) {
  return s.replace(/\n/g, "").length;
}

// ─── Step 3b：默认卡片短句选择 ──────────────────────────────────────────
function DefaultCardPhrases({
  phrases,
  onPhrasesChange,
  placeholderStyles,
  onStylesChange,
}: {
  phrases: string[] | undefined;
  onPhrasesChange: (phrases: string[]) => void;
  placeholderStyles: PlaceholderCardStyle[] | undefined;
  onStylesChange: (styles: PlaceholderCardStyle[]) => void;
}) {
  const selected = phrases ?? [];
  const isComposing = useRef<boolean[]>([]);
  const [customSlots, setCustomSlots] = useState<string[][]>(
    () => [0, 1, 2].map(() => [...CUSTOM_SLOT_DEFAULTS])
  );

  const updateSlotHex = (cardIdx: number, slotIdx: number, hex: string) => {
    setCustomSlots((prev) => {
      const next = prev.map((arr) => [...arr]);
      next[cardIdx][slotIdx] = hex;
      return next;
    });
  };

  const isCustom = (s: string) => !(BIRTHDAY_PHRASES as readonly string[]).includes(s);

  const togglePreset = (p: string) => {
    if (selected.includes(p)) {
      onPhrasesChange(selected.filter((s) => s !== p));
    } else if (selected.length < MAX_PHRASES) {
      onPhrasesChange([...selected, p]);
    }
  };

  const addCustomSlot = () => {
    if (selected.length >= MAX_PHRASES) return;
    onPhrasesChange([...selected, ""]);
  };

  const updateCustom = (slotIdx: number, val: string) => {
    const lines = val.split("\n");
    if (lines.length > 3) return;
    const chars = val.replace(/\n/g, "");
    const next = [...selected];
    next[slotIdx] = chars.length > MAX_CHARS ? truncateWithNewlines(val) : val;
    onPhrasesChange(next);
  };

  const removeSlot = (slotIdx: number) => {
    onPhrasesChange(selected.filter((_, i) => i !== slotIdx));
  };

  // 截断保留换行结构（同 Step3a truncate）
  function truncateWithNewlines(val: string): string {
    let kept = 0; let result = "";
    for (const ch of val) {
      if (ch === "\n") { result += ch; }
      else if (kept < MAX_CHARS) { result += ch; kept++; }
    }
    return result;
  }

  // 生成三张默认卡预览数据（带当前短句分配）
  const defaultCards = getDefaultCardPlaceholders(selected);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 标题行 */}
      <div className="flex flex-col gap-1 text-center">
        <p className="text-xs tracking-wide leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
          {selected.length === 0
            ? "不选则卡片无短句 · 最多选 3 条"
            : selected.length === 1
            ? "已选 1 条 · 三张卡片使用同一短句"
            : selected.length === 2
            ? "已选 2 条 · 前两张各用一条，第三张同第二条"
            : "已选 3 条 · 分别对应三张卡片"}
        </p>
      </div>

      {/* 预设短句 */}
      <div className="flex flex-wrap justify-center gap-2">
        {BIRTHDAY_PHRASES.map((p) => {
          const idx = selected.indexOf(p);
          const isSelected = idx !== -1;
          const canSelect = selected.length < MAX_PHRASES;
          return (
            <button
              key={p}
              onClick={() => togglePreset(p)}
              disabled={!isSelected && !canSelect}
              style={{
                fontSize: "0.68rem",
                letterSpacing: "0.1em",
                padding: "5px 14px",
                borderRadius: "20px",
                border: `1px solid ${isSelected ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)"}`,
                background: isSelected ? "rgba(255,255,255,0.10)" : "transparent",
                color: isSelected ? "rgba(255,255,255,0.85)" : (!isSelected && !canSelect) ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.50)",
                cursor: (!isSelected && !canSelect) ? "default" : "pointer",
                transition: "all 0.25s ease",
                position: "relative",
              }}
            >
              {p}
              {isSelected && (
                <span style={{ marginLeft: "6px", fontSize: "0.6rem", color: "rgba(255,255,255,0.5)" }}>
                  {idx + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 自定义输入槽 */}
      <AnimatePresence>
        {selected.map((s, slotIdx) => {
          if (!isCustom(s)) return null;
          const count = charCountSingle(s);
          return (
            <motion.div
              key={`custom-${slotIdx}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={springGentle}
              className="overflow-hidden w-full"
            >
              <div className="relative w-full">
                <textarea
                  value={s}
                  placeholder={`自定义短句 ${slotIdx + 1}（最多 ${MAX_CHARS} 字 · ≤3 行）`}
                  rows={2}
                  className="w-full bg-white/3 border border-white/12 rounded-xl px-4 py-3 text-sm font-light text-white/80 placeholder-white/20 focus:outline-none focus:border-white/28 transition-colors tracking-wide resize-none text-center"
                  style={{ lineHeight: "1.7" }}
                  onCompositionStart={() => { isComposing.current[slotIdx] = true; }}
                  onCompositionEnd={(e) => {
                    isComposing.current[slotIdx] = false;
                    updateCustom(slotIdx, e.currentTarget.value);
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (isComposing.current[slotIdx]) {
                      const lines = val.split("\n");
                      if (lines.length <= 3) {
                        const next = [...selected];
                        next[slotIdx] = val;
                        onPhrasesChange(next);
                      }
                      return;
                    }
                    updateCustom(slotIdx, val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const lines = s.split("\n");
                      if (lines.length >= 3) e.preventDefault();
                    }
                  }}
                />
                <div className="flex justify-between items-center px-1 mt-1">
                  <button
                    onClick={() => removeSlot(slotIdx)}
                    style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.22)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.1em" }}
                  >
                    移除
                  </button>
                  {count > 0 && (
                    <span style={{ fontSize: "0.62rem", color: count >= MAX_CHARS ? "rgba(255,160,80,0.8)" : "rgba(255,255,255,0.22)", letterSpacing: "0.05em" }}>
                      {count}/{MAX_CHARS}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* 加号：添加自定义短句槽 */}
      {selected.length < MAX_PHRASES && (
        <button
          onClick={addCustomSlot}
          style={{
            alignSelf: "center",
            width: "28px", height: "28px", borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "rgba(255,255,255,0.35)",
            fontSize: "1.1rem", lineHeight: 1,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          title="自定义短句"
        >
          +
        </button>
      )}

      {/* 已选列表预览 */}
      {selected.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 pt-1">
          {selected.map((s, i) => (
            <span
              key={i}
              style={{
                fontSize: "0.62rem", letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.28)",
                padding: "3px 10px", borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {i + 1}. {s || "（空）"}
            </span>
          ))}
          <button
            onClick={() => onPhrasesChange([])}
            style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.20)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.1em", padding: "3px 6px" }}
          >
            清空
          </button>
        </div>
      )}

      {/* 三张默认卡：每张一行，左侧控件 + 右侧预览图，垂直居中 */}
      <div className="w-full flex flex-col gap-4 pt-2">
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-xs text-white/40 tracking-wider text-center">预览</p>
          <p className="text-xs text-white/40 tracking-wider text-center">卡片效果仅供参考，以预览页为准</p>
        </div>
        {defaultCards.map(({ dataUrl, phrase }, i) => {
          const style = placeholderStyles?.[i] ?? {};
          const pos = style.captionPosition ?? "bottom";
          const align = style.captionAlign ?? "center";
          const size = style.captionSize ?? "sm";
          const color = style.captionColor ?? "rgba(255,255,255,0.92)";

          const updateStyle = (patch: Partial<PlaceholderCardStyle>) => {
            const current = placeholderStyles ? [...placeholderStyles] : [];
            while (current.length <= i) current.push({});
            current[i] = { ...current[i], ...patch };
            onStylesChange(current);
          };

          return (
            <div key={i}>
              <div className="flex items-center justify-center" style={{ gap: "2.5em" }}>
                {/* 左侧：控件列，固定宽度保证有/无短句时对齐一致 */}
                <div className="flex flex-col items-start gap-2" style={{ width: "10em" }}>
                  {phrase ? (
                    <>
                      <ControlRow label="位置">
                        {POSITIONS.map((p) => (
                          <PillBtn key={p.value} active={pos === p.value} onClick={() => updateStyle({ captionPosition: p.value })}>
                            {p.label}
                          </PillBtn>
                        ))}
                      </ControlRow>

                      <ControlRow label="对齐">
                        {ALIGNS.map((a) => (
                          <motion.button
                            key={a.value}
                            onClick={() => updateStyle({ captionAlign: a.value })}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                              width: 26, height: 24, borderRadius: 5,
                              border: `1px solid ${align === a.value ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)"}`,
                              background: align === a.value ? "rgba(255,255,255,0.1)" : "transparent",
                              color: align === a.value ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all 0.2s ease", flexShrink: 0,
                            }}
                          >
                            {a.label}
                          </motion.button>
                        ))}
                      </ControlRow>

                      <ControlRow label="字号">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1 flex-wrap">
                            {FONT_SIZES_ROW1.map((f) => (
                              <PillBtn key={f.value} active={size === f.value} onClick={() => updateStyle({ captionSize: f.value })}>{f.label}</PillBtn>
                            ))}
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {FONT_SIZES_ROW2.map((f) => (
                              <PillBtn key={f.value} active={size === f.value} onClick={() => updateStyle({ captionSize: f.value })}>{f.label}</PillBtn>
                            ))}
                          </div>
                        </div>
                      </ControlRow>

                      <ControlRow label="颜色">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex gap-1.5">
                            {FIXED_COLORS.map((c) => (
                              <ColorSwatch key={c.value} bg={c.swatch} selected={color === c.value} onClick={() => updateStyle({ captionColor: c.value })} />
                            ))}
                          </div>
                          <div className="flex gap-1.5">
                            {(customSlots[i] ?? CUSTOM_SLOT_DEFAULTS).map((hex, si) => (
                              <CustomColorSlot
                                key={si} hex={hex} selected={color === hexToRgba(hex)}
                                defaultHex={CUSTOM_SLOT_DEFAULTS[si]}
                                onPickerChange={(newHex) => updateSlotHex(i, si, newHex)}
                                onApply={() => updateStyle({ captionColor: hexToRgba((customSlots[i] ?? CUSTOM_SLOT_DEFAULTS)[si]) })}
                                onReset={() => updateStyle({ captionColor: hexToRgba(CUSTOM_SLOT_DEFAULTS[si]) })}
                              />
                            ))}
                          </div>
                        </div>
                      </ControlRow>
                    </>
                  ) : (
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.40)", letterSpacing: "0.1em" }}>
                      卡片 {i + 1} · 无短句
                    </span>
                  )}
                </div>

                {/* 右侧：预览图 */}
                <div className="flex-shrink-0" style={{ width: "clamp(90px, 32%, 140px)" }}>
                  <DefaultCardPreview
                    dataUrl={dataUrl}
                    phrase={phrase}
                    captionPosition={style.captionPosition}
                    captionAlign={style.captionAlign}
                    captionSize={style.captionSize}
                    captionColor={style.captionColor}
                  />
                </div>
              </div>

              {i < defaultCards.length - 1 && (
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginTop: "1rem" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// SVG 设计尺寸（与最终展示卡片的参考尺寸一致）
const CARD_W = 400;
const CARD_H = 500;

// 字号 px 映射（在固定 CARD_W 坐标系内）
function captionPx(size?: CardPhoto["captionSize"]): number {
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

// 用户照片卡片等比缩放预览
function ScaledPhotoCardPreview({ photo }: { photo: CardPhoto }) {
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

  const pos = photo.captionPosition ?? "bottom";
  const align = photo.captionAlign ?? "center";

  const posStyle: React.CSSProperties =
    pos === "top"
      ? { top: 0, bottom: "auto", paddingTop: 20, paddingBottom: 0 }
      : pos === "center"
      ? { top: "50%", bottom: "auto", transform: "translateY(-50%)", paddingBottom: 0 }
      : { bottom: 0, paddingBottom: 32 };

  const padStyle: React.CSSProperties =
    align === "left"
      ? { paddingLeft: 16, paddingRight: 32 }
      : align === "right"
      ? { paddingLeft: 32, paddingRight: 16 }
      : { paddingLeft: 16, paddingRight: 16 };

  return (
    <div
      ref={outerRef}
      className="relative w-full overflow-hidden rounded-xl"
      style={{ aspectRatio: `${CARD_W}/${CARD_H}` }}
    >
      <div
        style={{
          position: "absolute", top: 0, left: 0,
          width: CARD_W, height: CARD_H,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
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
            position: "absolute", left: 0, right: 0, margin: 0,
            fontSize: captionPx(photo.captionSize),
            fontWeight: 300,
            letterSpacing: "0.15em",
            color: photo.captionColor ?? "rgba(255,255,255,0.92)",
            lineHeight: 1.5,
            whiteSpace: "pre-line",
            textAlign: align,
            userSelect: "none",
            ...padStyle,
            ...posStyle,
          }}>
            {photo.caption}
          </p>
        )}
      </div>
    </div>
  );
}

// 默认卡片单张预览：内容以原始尺寸渲染，外层等比缩放
function DefaultCardPreview({
  dataUrl,
  phrase,
  captionPosition,
  captionAlign,
  captionSize,
  captionColor,
}: {
  dataUrl: string;
  phrase: string;
  captionPosition?: PlaceholderCardStyle["captionPosition"];
  captionAlign?: PlaceholderCardStyle["captionAlign"];
  captionSize?: PlaceholderCardStyle["captionSize"];
  captionColor?: string;
}) {
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

  const pos = captionPosition ?? "bottom";
  const align = captionAlign ?? "center";
  const fsPx = captionSize ? captionPx(captionSize) : 11;

  const posStyle: React.CSSProperties =
    pos === "top"
      ? { top: 0, bottom: "auto", paddingTop: 20, paddingBottom: 0 }
      : pos === "center"
      ? { top: "50%", bottom: "auto", transform: "translateY(-50%)", paddingBottom: 0 }
      : { bottom: 0, paddingBottom: 32 };

  const padStyle: React.CSSProperties =
    align === "left"
      ? { paddingLeft: 16, paddingRight: 32 }
      : align === "right"
      ? { paddingLeft: 32, paddingRight: 16 }
      : { paddingLeft: 16, paddingRight: 16 };

  return (
    // 外层：决定预览格占据的布局空间，overflow hidden
    <div
      ref={outerRef}
      className="relative w-full overflow-hidden rounded-xl"
      style={{ aspectRatio: `${CARD_W}/${CARD_H}` }}
    >
      {/* 内层：固定原始尺寸，从左上角等比缩放 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: CARD_W,
          height: CARD_H,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <img src={dataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {/* 渐变遮罩 */}
        <div style={{
          position: "absolute", inset: "0 0 0 0",
          height: "40%", bottom: 0, top: "auto",
          background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />
        {/* 短句：尺寸与最终卡片完全一致 */}
        {phrase && (
          <p
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              margin: 0,
              fontSize: fsPx,
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontWeight: "normal",
              letterSpacing: "0.12em",
              color: captionColor ?? "rgba(255,255,255,0.80)",
              lineHeight: 1.5,
              whiteSpace: "pre-line",
              textAlign: align,
              userSelect: "none",
              ...padStyle,
              ...posStyle,
            }}
          >
            {phrase}
          </p>
        )}
      </div>
    </div>
  );
}

export function Step3CardText({ photos, onChange, phrases, onPhrasesChange, placeholderStyles, onStylesChange, onNext, onBack, showGoToStep, onGoToStep }: Step3CardTextProps) {
  const [customSlots, setCustomSlots] = useState<string[][]>(
    () => photos.map(() => [...CUSTOM_SLOT_DEFAULTS])
  );
  const isComposing = useRef<boolean[]>([]);

  const getSlots = (i: number) => customSlots[i] ?? [...CUSTOM_SLOT_DEFAULTS];

  const updateSlotHex = (photoIdx: number, slotIdx: number, hex: string) => {
    setCustomSlots((prev) => {
      const next = prev.map((arr) => [...arr]);
      while (next.length <= photoIdx) next.push([...CUSTOM_SLOT_DEFAULTS]);
      next[photoIdx][slotIdx] = hex;
      return next;
    });
  };

  const update = <K extends keyof CardPhoto>(i: number, key: K, val: CardPhoto[K]) => {
    const updated = [...photos];
    updated[i] = { ...updated[i], [key]: val };
    onChange(updated);
  };

  const truncate = (val: string): string => {
    let kept = 0;
    let result = "";
    for (const ch of val) {
      if (ch === "\n") { result += ch; }
      else if (kept < 20) { result += ch; kept++; }
    }
    return result;
  };

  const handleCaptionChange = (i: number, val: string) => {
    const lines = val.split("\n");
    if (lines.length > 3) return;
    const chars = val.replace(/\n/g, "");
    update(i, "caption", chars.length > 20 ? truncate(val) : val);
  };

  // ── Step 3b：无照片时 ──────────────────────────────────────────────
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="tracking-[0.3em] text-white/45 mb-4" style={{ fontSize: "clamp(0.82rem, 1.6vw, 1rem)" }}>STEP 03</p>
          <h2 className="font-extralight tracking-wide text-white/92" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>卡片文字</h2>
          <p className="text-white/45 mt-2 tracking-wider" style={{ fontSize: "clamp(0.75rem, 1.3vw, 0.9rem)" }}>未上传照片 · 将使用默认卡片 · 可选卡片短句</p>
        </div>

        <DefaultCardPhrases phrases={phrases} onPhrasesChange={onPhrasesChange} placeholderStyles={placeholderStyles} onStylesChange={onStylesChange} />

        <div className="flex gap-4">
          <SpringButton variant="secondary" onClick={onBack}>返回</SpringButton>
          <SpringButton variant="primary" onClick={onNext}>下一步</SpringButton>
        </div>
        {showGoToStep && onGoToStep && (
          <GoToStepBar currentStep={3} onGoToStep={onGoToStep} />
        )}
      </div>
    );
  }

  // ── Step 3a：有照片时 ──────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="tracking-[0.3em] text-white/45 mb-4" style={{ fontSize: "clamp(0.82rem, 1.6vw, 1rem)" }}>STEP 03</p>
        <h2 className="font-extralight tracking-wide text-white/92" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>卡片文字</h2>
        <p className="text-white/45 mt-2 tracking-wider" style={{ fontSize: "clamp(0.75rem, 1.3vw, 0.9rem)" }}>可选 · 每张最多 20 字 · 支持换行（≤ 3 行）</p>
        <p style={{ fontSize: "0.62rem", letterSpacing: "0.08em", color: "rgba(255,255,255,0.40)", marginTop: "0.25rem" }}>卡片效果仅供参考，以预览页为准</p>
      </div>

      <div className="w-full flex flex-col gap-6">
        {photos.map((photo, i) => {
          const pos = photo.captionPosition ?? "bottom";
          const align = photo.captionAlign ?? "center";
          const size = photo.captionSize ?? "md";
          const color = photo.captionColor ?? "rgba(255,255,255,0.92)";
          const hasCaption = !!photo.caption;
          const slots = getSlots(i);
          const count = charCount(photo.caption);

          return (
            <div key={i}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
                  <div style={{ width: "100%" }} className="flex flex-col gap-2 items-start">
                    <div className="relative w-full">
                      <textarea
                        value={photo.caption || ""}
                        onCompositionStart={() => { isComposing.current[i] = true; }}
                        onCompositionEnd={(e) => {
                          isComposing.current[i] = false;
                          handleCaptionChange(i, e.currentTarget.value);
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (isComposing.current[i]) {
                            const lines = val.split("\n");
                            if (lines.length <= 3) update(i, "caption", val);
                            return;
                          }
                          handleCaptionChange(i, val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const lines = (photo.caption || "").split("\n");
                            if (lines.length >= 3) e.preventDefault();
                          }
                        }}
                        placeholder={`第 ${i + 1} 张文字（可选）`}
                        rows={1}
                        className="w-full bg-transparent text-sm font-light text-white/80 placeholder-white/18 focus:outline-none tracking-wide resize-none overflow-hidden leading-relaxed"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.12)",
                          paddingBottom: "6px",
                          paddingTop: "2px",
                          height: "auto",
                          minHeight: "1.8rem",
                          wordBreak: "break-all",
                          textAlign: align === "left" ? "left" : align === "right" ? "right" : "center",
                        }}
                        onInput={(e) => {
                          const el = e.currentTarget;
                          el.style.height = "auto";
                          el.style.height = el.scrollHeight + "px";
                        }}
                      />
                      {count > 0 && (
                        <span style={{
                          position: "absolute", right: 0, bottom: -15,
                          fontSize: "0.55rem", letterSpacing: "0.08em",
                          color: count >= 20 ? "rgba(255,180,100,0.8)" : "rgba(255,255,255,0.18)",
                        }}>
                          {count}/20
                        </span>
                      )}
                    </div>

                    <div style={{ alignSelf: "center" }}>
                    <AnimatePresence initial={false}>
                      {hasCaption && (
                        <motion.div
                          className="flex flex-col gap-2 items-start"
                          style={{ marginTop: count > 0 ? 14 : 4, alignSelf: "center" }}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={springGentle}
                        >
                          <ControlRow label="位置">
                            {POSITIONS.map((p) => (
                              <PillBtn key={p.value} active={pos === p.value} onClick={() => update(i, "captionPosition", p.value)}>
                                {p.label}
                              </PillBtn>
                            ))}
                          </ControlRow>

                          <ControlRow label="对齐">
                            {ALIGNS.map((a) => (
                              <motion.button
                                key={a.value}
                                onClick={() => update(i, "captionAlign", a.value)}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                  width: 26, height: 24, borderRadius: 5,
                                  border: `1px solid ${align === a.value ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)"}`,
                                  background: align === a.value ? "rgba(255,255,255,0.1)" : "transparent",
                                  color: align === a.value ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
                                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                  transition: "all 0.2s ease", flexShrink: 0,
                                }}
                              >
                                {a.label}
                              </motion.button>
                            ))}
                          </ControlRow>

                          <ControlRow label="字号">
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-1 flex-wrap">
                                {FONT_SIZES_ROW1.map((f) => (
                                  <PillBtn key={f.value} active={size === f.value} onClick={() => update(i, "captionSize", f.value)}>{f.label}</PillBtn>
                                ))}
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {FONT_SIZES_ROW2.map((f) => (
                                  <PillBtn key={f.value} active={size === f.value} onClick={() => update(i, "captionSize", f.value)}>{f.label}</PillBtn>
                                ))}
                              </div>
                            </div>
                          </ControlRow>

                          <ControlRow label="颜色">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex gap-1.5">
                                {FIXED_COLORS.map((c) => (
                                  <ColorSwatch key={c.value} bg={c.swatch} selected={color === c.value} onClick={() => update(i, "captionColor", c.value)} />
                                ))}
                              </div>
                              <div className="flex gap-1.5">
                                {slots.map((hex, si) => (
                                  <CustomColorSlot
                                    key={si} hex={hex} selected={color === hexToRgba(hex)}
                                    defaultHex={CUSTOM_SLOT_DEFAULTS[si]}
                                    onPickerChange={(newHex) => updateSlotHex(i, si, newHex)}
                                    onApply={() => update(i, "captionColor", hexToRgba(slots[si]))}
                                    onReset={() => update(i, "captionColor", hexToRgba(CUSTOM_SLOT_DEFAULTS[si]))}
                                  />
                                ))}
                              </div>
                            </div>
                          </ControlRow>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0" style={{ width: "clamp(120px, 38%, 240px)" }}>
                  <ScaledPhotoCardPreview photo={photo} />
                </div>
              </div>

              {i < photos.length - 1 && (
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginTop: "1.25rem" }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4">
        <SpringButton variant="secondary" onClick={onBack}>返回</SpringButton>
        <SpringButton variant="primary" onClick={onNext}>下一步</SpringButton>
      </div>

      {showGoToStep && onGoToStep && (
        <GoToStepBar currentStep={3} onGoToStep={onGoToStep} />
      )}
    </div>
  );
}

// ─── 固定色块 ─────────────────────────────────────────────────────────
function ColorSwatch({ bg, selected, onClick }: { bg: string; selected: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      style={{
        width: 22, height: 22, borderRadius: "50%",
        background: bg,
        border: selected ? "3px solid rgba(255,255,255,0.95)" : "2px solid rgba(255,255,255,0.12)",
        cursor: "pointer", flexShrink: 0,
        transition: "border 0.2s ease, box-shadow 0.2s ease",
        boxShadow: selected
          ? "0 0 0 3px rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.4)"
          : "0 1px 4px rgba(0,0,0,0.3)",
      }}
    />
  );
}

// ─── 自定义颜色选择器 ──────────────────────────────────────────────────
// HSV 颜色空间工具函数
function hexToHsv(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, max === 0 ? 0 : d / max, max];
}

function hsvToHex(h: number, s: number, v: number): string {
  h = h / 360;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return "#" + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}

function CustomColorPicker({
  hex, defaultHex, onChange, onReset, onClose,
}: {
  hex: string;
  defaultHex: string;
  onChange: (hex: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(hex));
  const [hexInput, setHexInput] = useState(hex);
  const [mode, setMode] = useState<"hex" | "rgb">("hex");
  const [rgb, setRgb] = useState<[number, number, number]>(() => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  });
  const [eyedropperActive, setEyedropperActive] = useState(false);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const draggingSv = useRef(false);
  const draggingHue = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

  // 同步外部 hex 变化
  useEffect(() => {
    const h = hexToHsv(hex);
    setHsv(h);
    setHexInput(hex);
    setRgb([parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]);
  }, [hex]);

  const applyHex = useCallback((newHex: string) => {
    const h = hexToHsv(newHex);
    setHsv(h);
    setHexInput(newHex);
    setRgb([parseInt(newHex.slice(1, 3), 16), parseInt(newHex.slice(3, 5), 16), parseInt(newHex.slice(5, 7), 16)]);
    onChange(newHex);
  }, [onChange]);

  const currentHex = hsvToHex(hsv[0], hsv[1], hsv[2]);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [onClose]);

  const updateSv = useCallback((clientX: number, clientY: number) => {
    const el = svRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    setHsv(([h]) => [h, s, v]);
    const newHex = hsvToHex(hsv[0], s, v);
    setHexInput(newHex);
    setRgb([parseInt(newHex.slice(1, 3), 16), parseInt(newHex.slice(3, 5), 16), parseInt(newHex.slice(5, 7), 16)]);
    onChange(newHex);
  }, [hsv, onChange]);

  const updateHue = useCallback((clientX: number) => {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const h = Math.max(0, Math.min(360, ((clientX - rect.left) / rect.width) * 360));
    setHsv(([, s, v]) => [h, s, v]);
    const newHex = hsvToHex(h, hsv[1], hsv[2]);
    setHexInput(newHex);
    setRgb([parseInt(newHex.slice(1, 3), 16), parseInt(newHex.slice(3, 5), 16), parseInt(newHex.slice(5, 7), 16)]);
    onChange(newHex);
  }, [hsv, onChange]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      if (draggingSv.current) updateSv(x, y);
      if (draggingHue.current) updateHue(x);
    };
    const onUp = () => { draggingSv.current = false; draggingHue.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };
  }, [updateSv, updateHue]);

  // 吸管功能
  const abortRef = useRef<AbortController | null>(null);
  const handleEyedropper = useCallback(async () => {
    if (!("EyeDropper" in window)) return;
    const abort = new AbortController();
    abortRef.current = abort;
    try {
      // @ts-expect-error EyeDropper API 尚未进入 TS lib
      const dropper = new window.EyeDropper();
      const result = await dropper.open({ signal: abort.signal });
      applyHex(result.sRGBHex);
      setEyedropperActive(false);
    } catch {
      setEyedropperActive(false);
    }
    abortRef.current = null;
  }, [applyHex]);

  const cancelEyedropper = useCallback(() => {
    abortRef.current?.abort();
    setEyedropperActive(false);
  }, []);

  const hueColor = hsvToHex(hsv[0], 1, 1);
  const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;

  // 计算 picker 弹出位置，防止溢出视口
  const [pickerOffset, setPickerOffset] = useState(0);
  const wrapperRefCallback = useCallback((node: HTMLDivElement | null) => {
    (wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const vw = window.innerWidth;
    const overflow = rect.right - vw + 8;
    if (overflow > 0) setPickerOffset(-overflow);
    else if (rect.left < 8) setPickerOffset(8 - rect.left);
  }, []);

  return (
    <>
      {/* 吸管激活时：右上角悬浮提示条 + × 取消按钮，不拦截屏幕点击 */}
      {eyedropperActive && (
        <div
          style={{
            position: "fixed",
            top: "clamp(12px, 3vh, 24px)",
            right: "clamp(12px, 3vw, 24px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(14,18,36,0.92)",
            border: "1px solid rgba(120,180,255,0.35)",
            borderRadius: 10,
            padding: "8px 12px 8px 14px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 0 3L8 15l-4 1 1-4 8.5-8.5a2.121 2.121 0 0 1 3 0z" stroke="rgba(120,180,255,0.85)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="5" cy="15" r="1.2" fill="rgba(120,180,255,0.85)"/>
          </svg>
          <span style={{
            color: "rgba(200,220,255,0.82)",
            fontSize: "clamp(0.65rem, 1.8vw, 0.78rem)",
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
          }}>
            吸管已激活
          </span>
          {/* × 按钮：可点击，独立 pointerEvents */}
          <button
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); cancelEyedropper(); }}
            onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); cancelEyedropper(); }}
            style={{
              pointerEvents: "auto",
              marginLeft: 4,
              width: 20, height: 20,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.65)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem",
              lineHeight: 1,
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,80,0.25)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,160,160,0.9)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,80,80,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
            }}
            title="取消吸管"
          >
            ×
          </button>
        </div>
      )}
      <div
        ref={wrapperRefCallback}
        style={{
          position: "absolute",
          zIndex: 1000,
          bottom: "calc(100% + 8px)",
          left: `calc(50% + ${pickerOffset}px)`,
          transform: "translateX(-50%)",
          background: "rgba(14,18,36,0.98)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 12,
          padding: "clamp(8px, 2vw, 12px)",
          width: "clamp(180px, 48vw, 220px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          userSelect: "none",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
      {/* SV 选择区域 */}
      <div
        ref={svRef}
        style={{
          width: "100%",
          height: 120,
          borderRadius: 8,
          background: `linear-gradient(to bottom, transparent, black),
                       linear-gradient(to right, white, ${hueColor})`,
          position: "relative",
          cursor: "crosshair",
          overflow: "hidden",
        }}
        onMouseDown={(e) => {
          draggingSv.current = true;
          updateSv(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          draggingSv.current = true;
          updateSv(e.touches[0].clientX, e.touches[0].clientY);
        }}
      >
        <div style={{
          position: "absolute",
          left: `${hsv[1] * 100}%`,
          top: `${(1 - hsv[2]) * 100}%`,
          transform: "translate(-50%, -50%)",
          width: 12, height: 12,
          borderRadius: "50%",
          border: "2px solid white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
          pointerEvents: "none",
        }} />
      </div>

      {/* 色相滑块 */}
      <div
        ref={hueRef}
        style={{
          marginTop: 8,
          width: "100%",
          height: 14,
          borderRadius: 7,
          background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
          position: "relative",
          cursor: "pointer",
        }}
        onMouseDown={(e) => {
          draggingHue.current = true;
          updateHue(e.clientX);
        }}
        onTouchStart={(e) => {
          draggingHue.current = true;
          updateHue(e.touches[0].clientX);
        }}
      >
        <div style={{
          position: "absolute",
          left: `${(hsv[0] / 360) * 100}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 16, height: 16,
          borderRadius: "50%",
          background: hueColor,
          border: "2px solid white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
          pointerEvents: "none",
        }} />
      </div>

      {/* 预览色块 + 吸管 + 模式切换 */}
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: currentHex,
          border: "1px solid rgba(255,255,255,0.2)",
          flexShrink: 0,
        }} />

        {/* 吸管按钮 */}
        {hasEyeDropper && (
          <button
            title={isTouchDevice ? "点击吸取颜色" : "左键吸取 · 右键取消"}
            onClick={() => {
              if (!eyedropperActive) {
                setEyedropperActive(true);
                handleEyedropper();
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setEyedropperActive(false);
            }}
            style={{
              width: 28, height: 28,
              borderRadius: 6,
              border: `1px solid ${eyedropperActive ? "rgba(120,180,255,0.6)" : "rgba(255,255,255,0.15)"}`,
              background: eyedropperActive ? "rgba(120,180,255,0.15)" : "rgba(255,255,255,0.06)",
              color: eyedropperActive ? "rgba(120,180,255,0.9)" : "rgba(255,255,255,0.55)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M16.5 3.5a2.121 2.121 0 0 1 0 3L8 15l-4 1 1-4 8.5-8.5a2.121 2.121 0 0 1 3 0z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="5" cy="15" r="1.2" fill="currentColor"/>
            </svg>
          </button>
        )}

        {/* HEX/RGB 切换按钮 */}
        <button
          onClick={() => setMode(m => m === "hex" ? "rgb" : "hex")}
          style={{
            marginLeft: "auto",
            padding: "3px 7px",
            borderRadius: 5,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.5)",
            fontSize: "0.62rem",
            letterSpacing: "0.08em",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {mode === "hex" ? "RGB" : "HEX"}
        </button>
      </div>

      {/* 输入区：HEX 或 RGB */}
      {mode === "hex" ? (
        <input
          value={hexInput}
          onChange={(e) => {
            const val = e.target.value;
            setHexInput(val);
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
              applyHex(val);
            }
          }}
          style={{
            marginTop: 6,
            width: "100%",
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6,
            color: "rgba(255,255,255,0.85)",
            fontSize: "0.72rem",
            letterSpacing: "0.08em",
            padding: "4px 8px",
            fontFamily: "monospace",
            outline: "none",
          }}
          spellCheck={false}
          onFocus={(e) => e.target.select()}
        />
      ) : (
        <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
          {(["R", "G", "B"] as const).map((ch, ci) => {
            const val = rgb[ci];
            const setVal = (v: number) => {
              const clamped = Math.max(0, Math.min(255, v));
              const nr = ci === 0 ? clamped : rgb[0];
              const ng = ci === 1 ? clamped : rgb[1];
              const nb = ci === 2 ? clamped : rgb[2];
              setRgb([nr, ng, nb]);
              const newHex = "#" + [nr, ng, nb].map(x => x.toString(16).padStart(2, "0")).join("");
              setHexInput(newHex);
              applyHex(newHex);
            };
            return (
              <div key={ch} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>{ch}</span>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", gap: 1 }}>
                  {/* 上箭头 */}
                  <button
                    onClick={() => setVal(val + 1)}
                    style={{
                      width: "100%", height: 14,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "4px 4px 0 0",
                      color: "rgba(255,255,255,0.45)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      padding: 0, lineHeight: 1,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                  >
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M4 1L7 5H1L4 1Z" fill="currentColor"/>
                    </svg>
                  </button>
                  {/* 数字显示 / 输入 */}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={val}
                    onChange={(e) => {
                      const n = parseInt(e.target.value);
                      if (!isNaN(n)) setVal(n);
                      else if (e.target.value === "") setVal(0);
                    }}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderTop: "none",
                      borderBottom: "none",
                      color: "rgba(255,255,255,0.85)",
                      fontSize: "0.68rem",
                      padding: "3px 2px",
                      textAlign: "center",
                      outline: "none",
                      fontFamily: "monospace",
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                  {/* 下箭头 */}
                  <button
                    onClick={() => setVal(val - 1)}
                    style={{
                      width: "100%", height: 14,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "0 0 4px 4px",
                      color: "rgba(255,255,255,0.45)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      padding: 0, lineHeight: 1,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                  >
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M4 5L1 1H7L4 5Z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 恢复默认按钮 */}
      <button
        onClick={() => { onReset(); }}
        style={{
          marginTop: 10,
          width: "100%",
          padding: "5px 0",
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.6)",
          fontSize: "0.68rem",
          letterSpacing: "0.12em",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: defaultHex, border: "1px solid rgba(255,255,255,0.3)", flexShrink: 0 }} />
        恢复默认
      </button>
    </div>
    </>
  );
}

// ─── 自定义色槽 ───────────────────────────────────────────────────────
// 点击色块：移动端先应用颜色再打开 picker；桌面端左键直接应用
// 铅笔图标：两端均可打开 picker
function CustomColorSlot({ hex, selected, onPickerChange, onApply, onReset, defaultHex }: {
  hex: string;
  selected: boolean;
  onPickerChange: (hex: string) => void;
  onApply: () => void;
  onReset: () => void;
  defaultHex: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isTouchRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback((newHex: string) => {
    onPickerChange(newHex);
    onApply();
  }, [onPickerChange, onApply]);

  const handleReset = useCallback(() => {
    onPickerChange(defaultHex);
    onReset();
  }, [defaultHex, onPickerChange, onReset]);

  const openPicker = () => setPickerOpen(true);

  return (
    <div ref={containerRef} style={{ position: "relative", width: 22, height: 22, flexShrink: 0 }}>
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onTouchStart={() => { isTouchRef.current = true; }}
        onClick={() => {
          if (isTouchRef.current) {
            isTouchRef.current = false;
            // 移动端：先应用当前颜色，再打开 picker
            onApply();
            setPickerOpen(true);
          } else {
            // 桌面端左键：应用颜色
            onApply();
          }
        }}
        style={{
          width: 22, height: 22, borderRadius: "50%",
          background: hex,
          border: selected ? "3px solid rgba(255,255,255,0.95)" : "2px solid rgba(255,255,255,0.28)",
          cursor: "pointer",
          boxShadow: selected
            ? "0 0 0 3px rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.4)"
            : "0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
          transition: "border 0.2s ease, box-shadow 0.2s ease",
          position: "relative",
        }}
      >
        {/* 铅笔图标：点击打开 picker */}
        <div
          onClick={(e) => { e.stopPropagation(); openPicker(); }}
          style={{
            position: "absolute", bottom: -3, right: -3,
            width: 13, height: 13,
            background: "rgba(8,12,26,0.95)",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path d="M6.5 1.5l2 2-5 5H1.5v-2l5-5z" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </motion.button>

      {/* 自定义颜色选择器弹窗 */}
      {pickerOpen && (
        <CustomColorPicker
          hex={hex}
          defaultHex={defaultHex}
          onChange={handleChange}
          onReset={handleReset}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

// ─── 工具组件 ─────────────────────────────────────────────────────────
function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="text-xs text-white/40 tracking-wider flex-shrink-0"
        style={{ minWidth: "2rem", paddingTop: "3px" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function PillBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: "0.68rem",
        letterSpacing: "0.1em",
        padding: "3px 9px",
        borderRadius: "20px",
        border: `1px solid ${active ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)"}`,
        background: active ? "rgba(255,255,255,0.1)" : "transparent",
        color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
        cursor: "pointer",
        transition: "all 0.22s ease",
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
