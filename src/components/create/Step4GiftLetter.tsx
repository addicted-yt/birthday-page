"use client";
import { useRef } from "react";
import type { ReactNode } from "react";
import { SpringButton } from "@/components/ui/SpringButton";
import { CreateStep } from "@/types/birthday";
import { GoToStepBar } from "./GoToStepBar";

const MAX_CHARS = 1000;

type Align = "left" | "center" | "right";

interface Step4GiftLetterProps {
  letter: string;
  letterAlign?: Align;
  onChange: (letter: string) => void;
  onAlignChange: (align: Align) => void;
  onNext: () => void;
  onBack: () => void;
  showGoToStep?: boolean;
  onGoToStep?: (step: CreateStep) => void;
}

const ALIGNS: { value: Align; label: string; icon: ReactNode }[] = [
  {
    value: "left",
    label: "左对齐",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="1" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="1" y1="11" x2="11" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "center",
    label: "居中",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "right",
    label: "右对齐",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="5" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="3" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

function charCount(s: string) {
  // 换行算1字符，其余按字符计
  return s.length;
}

function truncateLetter(val: string): string {
  if (val.length <= MAX_CHARS) return val;
  return val.slice(0, MAX_CHARS);
}

export function Step4GiftLetter({
  letter,
  letterAlign = "center",
  onChange,
  onAlignChange,
  onNext,
  onBack,
  showGoToStep,
  onGoToStep,
}: Step4GiftLetterProps) {
  const isComposing = useRef(false);
  const count = charCount(letter);
  const nearLimit = count >= MAX_CHARS * 0.9;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <p className="tracking-[0.3em] text-white/45 mb-4" style={{ fontSize: "clamp(0.82rem, 1.6vw, 1rem)" }}>STEP 04</p>
        <h2 className="font-extralight tracking-wide text-white/92" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>
          礼物信
        </h2>
        <p className="text-white/45 mt-2 tracking-wider" style={{ fontSize: "clamp(0.75rem, 1.3vw, 0.9rem)" }}>可以修改成你的话</p>
      </div>

      {/* Alignment toggle */}
      <div className="flex items-center gap-1 justify-center">
        {ALIGNS.map(({ value, label, icon }) => {
          const active = letterAlign === value;
          return (
            <button
              key={value}
              aria-label={label}
              onClick={() => onAlignChange(value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                borderRadius: "8px",
                border: `1px solid ${active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.10)"}`,
                background: active ? "rgba(255,255,255,0.10)" : "transparent",
                color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
                fontSize: "0.68rem",
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {icon}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="w-full relative">
        <textarea
          value={letter}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={(e) => {
            isComposing.current = false;
            onChange(truncateLetter(e.currentTarget.value));
          }}
          onChange={(e) => {
            if (isComposing.current) {
              onChange(e.target.value);
              return;
            }
            onChange(truncateLetter(e.target.value));
          }}
          rows={10}
          className="w-full bg-white/3 border border-white/10 rounded-xl p-5 text-sm font-light text-white/80 placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors leading-relaxed tracking-wide resize-none"
          style={{ lineHeight: "1.9", textAlign: letterAlign }}
        />
        {/* 字数提示，右下角 */}
        <span
          style={{
            position: "absolute",
            right: "0.75rem",
            bottom: "0.5rem",
            fontSize: "0.58rem",
            letterSpacing: "0.06em",
            color: nearLimit ? "rgba(255,160,80,0.75)" : "rgba(255,255,255,0.18)",
            pointerEvents: "none",
            transition: "color 0.3s ease",
          }}
        >
          {count}/{MAX_CHARS}
        </span>
      </div>

      <div className="flex gap-4">
        <SpringButton variant="secondary" onClick={onBack}>返回</SpringButton>
        <SpringButton variant="primary" onClick={onNext}>下一步</SpringButton>
      </div>

      {showGoToStep && onGoToStep && (
        <GoToStepBar currentStep={4} onGoToStep={onGoToStep} />
      )}
    </div>
  );
}
