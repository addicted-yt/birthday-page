"use client";
import { motion } from "framer-motion";
import { springGentle } from "@/lib/animationPresets";

const lines = [
  { text: "未来", delay: 0.3 },
  { text: "还有很多故事", delay: 0.7 },
  { text: "等你去创造", delay: 1.1 },
];

export function Scene6Uplift() {
  return (
    <section
      className="scroll-snap-start flex items-center justify-center"
      style={{ zIndex: 10 }}
    >
      <div className="text-center px-8 flex flex-col items-center" style={{ gap: "clamp(0.8rem,3vh,1.4rem)" }}>
        {lines.map((line, i) => (
          <motion.p
            key={i}
            className="font-extralight select-none"
            style={{
              fontSize: i === 0
                ? "clamp(1.1rem, 3.2vw, 1.8rem)"
                : "clamp(1.25rem, 3.8vw, 2.2rem)",
              letterSpacing: "0.22em",
              color: i === lines.length - 1
                ? "rgba(255,255,255,0.88)"
                : "rgba(255,255,255,0.55)",
            }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ ...springGentle, delay: line.delay, duration: 1.1 }}
          >
            {line.text}
          </motion.p>
        ))}
      </div>
    </section>
  );
}
