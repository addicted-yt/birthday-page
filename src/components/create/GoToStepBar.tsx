"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateStep } from "@/types/birthday";
import { springGentle } from "@/lib/animationPresets";

const STEP_LABELS: { step: CreateStep; label: string }[] = [
  { step: 1, label: "01 · 名字" },
  { step: 2, label: "02 · 卡片照片" },
  { step: 3, label: "03 · 卡片文字" },
  { step: 4, label: "04 · 祝福信" },
  { step: 5, label: "05 · 礼物图片" },
  { step: 6, label: "06 · 背景音乐" },
  { step: 7, label: "07 · 预览" },
];

interface GoToStepBarProps {
  currentStep: CreateStep;
  onGoToStep: (step: CreateStep) => void;
}

export function GoToStepBar({ currentStep, onGoToStep }: GoToStepBarProps) {
  const [open, setOpen] = useState(false);
  const steps = STEP_LABELS.filter((s) => s.step !== currentStep);

  return (
    <div className="flex flex-col items-center gap-2 pt-1">
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          fontSize: "0.72rem",
          letterSpacing: "0.22em",
          color: open ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.28)",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          transition: "color 0.2s ease",
        }}
      >
        <span>前往指定步骤</span>
        <motion.svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          animate={{ rotate: open ? 180 : 0 }}
          transition={springGentle}
        >
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="flex flex-wrap justify-center gap-2 w-full"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={springGentle}
          >
            {steps.map(({ step, label }) => (
              <motion.button
                key={step}
                onClick={() => { setOpen(false); onGoToStep(step); }}
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
  );
}
