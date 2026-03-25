"use client";
import { useState, useRef, useEffect } from "react";
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
                                onPickerChange={(newHex) => updateSlotHex(i, si, newHex)}
                                onApply={() => updateStyle({ captionColor: hexToRgba((customSlots[i] ?? CUSTOM_SLOT_DEFAULTS)[si]) })}
                                onCancel={() => updateStyle({ captionColor: undefined })}
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
                                    onPickerChange={(newHex) => updateSlotHex(i, si, newHex)}
                                    onApply={() => update(i, "captionColor", hexToRgba(slots[si]))}
                                    onCancel={() => update(i, "captionColor", undefined)}
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
        border: selected ? "2px solid rgba(255,255,255,0.85)" : "2px solid rgba(255,255,255,0.12)",
        cursor: "pointer", flexShrink: 0,
        transition: "border 0.2s ease, box-shadow 0.2s ease",
        boxShadow: selected
          ? "0 0 0 2px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.4)"
          : "0 1px 4px rgba(0,0,0,0.3)",
      }}
    />
  );
}

// ─── 自定义色槽 ───────────────────────────────────────────────────────
// 桌面：左键=应用颜色，右键=取消选中；铅笔图标=打开调色盘（onChange实时apply）
// 移动：点整个色块打开调色盘，onChange实时apply
function CustomColorSlot({ hex, selected, onPickerChange, onApply, onCancel }: {
  hex: string;
  selected: boolean;
  onPickerChange: (hex: string) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isTouchRef = useRef(false);

  return (
    <div style={{ position: "relative", width: 22, height: 22, flexShrink: 0 }}>
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onTouchStart={() => { isTouchRef.current = true; }}
        onClick={() => {
          if (isTouchRef.current) {
            // 移动端：打开调色盘
            isTouchRef.current = false;
            inputRef.current?.click();
          } else {
            // 桌面端左键：应用颜色
            onApply();
          }
        }}
        onContextMenu={(e) => { e.preventDefault(); onCancel(); }}
        style={{
          width: 22, height: 22, borderRadius: "50%",
          background: hex,
          border: selected ? "2px solid rgba(255,255,255,0.85)" : "2px solid rgba(255,255,255,0.28)",
          cursor: "pointer",
          boxShadow: selected
            ? "0 0 0 2px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.4)"
            : "0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
          transition: "border 0.2s ease, box-shadow 0.2s ease",
          position: "relative",
        }}
      >
        {/* 铅笔图标：桌面端专用，点击打开 picker */}
        <div
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
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

      {/* 隐藏的 color input，由铅笔图标或移动端色块点击触发 */}
      <input
        ref={inputRef}
        type="color"
        value={hex}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
        onChange={(e) => { onPickerChange(e.target.value); onApply(); }}
      />
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
