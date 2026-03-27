"use client";
import { motion } from "framer-motion";
import { EmojiImage } from "@/components/ui/EmojiImage";
import { springGentle } from "@/lib/animationPresets";

interface Scene7EndingProps {
  name: string;
  onVisible?: () => void;
}

export function Scene7Ending({ name, onVisible }: Scene7EndingProps) {
  return (
    <section
      className="scroll-snap-start flex items-center justify-center"
      style={{ zIndex: 10 }}
    >
      <div className="text-center px-8 flex flex-col items-center" style={{ gap: "clamp(1.2rem,4vh,2rem)" }}>
        {/* 前两行文字 */}
        {["而今天", "只属于你"].map((text, i) => (
          <motion.p
            key={i}
            className="font-extralight select-none"
            style={{
              fontSize: "clamp(1.15rem, 3.8vw, 2rem)",
              letterSpacing: "0.24em",
              color: "rgba(255,255,255,0.65)",
            }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ ...springGentle, delay: 0.2 + i * 0.38, duration: 1.1 }}
          >
            {text}
          </motion.p>
        ))}

        {/* 生日蛋糕 emoji */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ ...springGentle, delay: 0.95, duration: 1.2 }}
          onAnimationComplete={onVisible}
          style={{ margin: "clamp(0.5rem,2vh,1rem) 0" }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <EmojiImage emoji="birthday" size={80} className="drop-shadow-lg" priority />
          </motion.div>
        </motion.div>

        {/* 名字 */}
        <motion.p
          className="font-extralight select-none"
          style={{
            fontSize: "clamp(1.6rem, 6vw, 3.2rem)",
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.1,
          }}
          initial={{ opacity: 0, filter: "blur(12px)", scale: 0.96 }}
          whileInView={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          viewport={{ once: true }}
          transition={{ ...springGentle, delay: 1.35, duration: 1.3 }}
        >
          {name}
        </motion.p>
      </div>
    </section>
  );
}
