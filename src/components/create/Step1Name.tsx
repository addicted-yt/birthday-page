"use client";
import { useEffect, useRef } from "react";
import { SpringButton } from "@/components/ui/SpringButton";

const MAX_CHARS = 15;

function truncateName(val: string): string {
  return Array.from(val).slice(0, MAX_CHARS).join("");
}

interface Step1NameProps {
  name: string;
  onChange: (name: string) => void;
  onNext: () => void;
}

export function Step1Name({ name, onChange, onNext }: Step1NameProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposing = useRef(false);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="text-center">
        <p className="tracking-[0.3em] text-white/45 mb-4" style={{ fontSize: "clamp(0.82rem, 1.6vw, 1rem)" }}>STEP 01</p>
        <h2 className="font-extralight tracking-wide text-white/92" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>
          TA 叫什么名字？
        </h2>
      </div>

      <div className="w-full">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={(e) => {
            isComposing.current = false;
            onChange(truncateName(e.currentTarget.value));
          }}
          onChange={(e) => {
            if (isComposing.current) {
              // IME 组合中：临时更新，不截断（避免候选词被切断）
              onChange(e.target.value);
              return;
            }
            onChange(truncateName(e.target.value));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); name.trim() && onNext(); }
          }}
          placeholder="输入名字"
          className="w-full bg-transparent border-b border-white/15 text-center text-xl font-light text-white/90 placeholder-white/20 pb-3 focus:outline-none focus:border-white/35 transition-colors tracking-widest"
        />
      </div>

      <SpringButton
        variant="primary"
        onClick={onNext}
        disabled={!name.trim()}
      >
        下一步
      </SpringButton>
    </div>
  );
}
