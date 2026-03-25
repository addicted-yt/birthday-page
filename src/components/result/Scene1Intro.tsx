"use client";
import { motion } from "framer-motion";
import { springGentle } from "@/lib/animationPresets";

const lines = [
  { text: "今天", delay: 0.3 },
  { text: "宇宙里曾发生过", delay: 0.75 },
  { text: "一件重要的事", delay: 1.05 },
  { text: "因为你诞生了", delay: 1.55, bright: true },
];

export function Scene1Intro() {
  return (
    <section
      className="scroll-snap-start relative flex items-center justify-center"
      style={{ zIndex: 10 }}
    >
      <div className="text-center px-8 flex flex-col items-center gap-5">
        {lines.map((line, i) => (
          <motion.p
            key={i}
            className="font-extralight leading-none select-none"
            style={{
              fontSize: i === 0 ? "clamp(1.1rem, 3.2vw, 1.8rem)" : "clamp(1.25rem, 3.8vw, 2.2rem)",
              letterSpacing: "0.22em",
              color: line.bright ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.62)",
              marginTop: i === lines.length - 1 ? "clamp(1rem,4vh,2.5rem)" : 0,
            }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ ...springGentle, delay: line.delay, duration: 1.1 }}
          >
            {line.text}
          </motion.p>
        ))}
      </div>
    </section>
  );
}
