"use client";
import { motion } from "framer-motion";
import { springPress } from "@/lib/animationPresets";
import React, { ReactNode } from "react";

interface SpringButtonProps {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}

export function SpringButton({
  onClick,
  children,
  className = "",
  variant = "primary",
  disabled = false,
}: SpringButtonProps) {
  const base =
    "relative inline-flex items-center justify-center px-8 py-3 text-sm tracking-widest font-light rounded-full transition-opacity cursor-pointer no-select";

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {},
    secondary: {
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      background: "rgba(255,255,255,0.06)",
    },
    ghost: {
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
    },
  };

  const variants = {
    primary:
      "bg-white/90 text-[#050810] hover:bg-white",
    secondary:
      "border border-white/20 text-white/70 hover:border-white/40 hover:text-white",
    ghost: "text-white/60 hover:text-white",
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? "opacity-30 cursor-not-allowed" : ""} ${className}`}
      style={variantStyles[variant]}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.96 }}
      transition={springPress}
    >
      {children}
    </motion.button>
  );
}
