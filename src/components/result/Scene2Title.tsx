"use client";
import { motion } from "framer-motion";
import { springGentle } from "@/lib/animationPresets";

interface Scene2TitleProps {
  name: string;
}

// 把名字拆成单字，逐字从模糊粒子中聚合出现
function ParticleChar({ char, delay }: { char: string; delay: number }) {
  return (
    <motion.span
      style={{ display: "inline-block", willChange: "filter, opacity, transform" }}
      initial={{ opacity: 0, filter: "blur(20px)", scale: 1.15, y: 8 }}
      whileInView={{ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ ...springGentle, delay, duration: 1.1 }}
    >
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
}

export function Scene2Title({ name }: Scene2TitleProps) {
  const chars = Array.from(name);

  return (
    <section className="scroll-snap-start flex items-center justify-center" style={{ zIndex: 10 }}>
      <div className="text-center px-8 flex flex-col items-center" style={{ gap: "clamp(1rem,3vh,1.8rem)" }}>

        {/* HAPPY BIRTHDAY */}
        <motion.p
          style={{
            fontSize: "clamp(1.1rem, 5vw, 3.2rem)",
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.40)",
            fontWeight: 200,
            lineHeight: 1.0,
          }}
          initial={{ opacity: 0, filter: "blur(16px)", y: 8 }}
          whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ ...springGentle, delay: 0.15, duration: 0.9 }}
        >
          HAPPY BIRTHDAY
        </motion.p>

        {/* 名字 — 比 HAPPY BIRTHDAY 略大，逐字粒子聚合 */}
        <h1
          className="font-extralight tracking-[0.14em] text-white"
          style={{ fontSize: "clamp(2rem, 8vw, 5.5rem)", lineHeight: 1.0, letterSpacing: "0.14em" }}
        >
          {chars.map((char, i) => (
            <ParticleChar
              key={i}
              char={char}
              delay={0.5 + i * 0.12}
            />
          ))}
        </h1>

        {/* 装饰线 */}
        <motion.div
          style={{ width: "32px", height: "1px", background: "rgba(255,255,255,0.12)" }}
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ ...springGentle, delay: 0.5 + chars.length * 0.12 + 0.3 }}
        />
      </div>
    </section>
  );
}
