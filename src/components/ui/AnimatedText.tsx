"use client";
import { motion } from "framer-motion";
import { fadeInUp, springGentle } from "@/lib/animationPresets";

interface AnimatedTextProps {
  lines: string[];
  className?: string;
  baseDelay?: number;
  stepDelay?: number;
}

export function AnimatedText({
  lines,
  className = "",
  baseDelay = 0.2,
  stepDelay = 0.25,
}: AnimatedTextProps) {
  return (
    <>
      {lines.map((line, i) => (
        <motion.p
          key={i}
          className={className}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          custom={baseDelay + i * stepDelay}
          transition={{
            ...springGentle,
            delay: baseDelay + i * stepDelay,
          }}
        >
          {line}
        </motion.p>
      ))}
    </>
  );
}
