"use client";
import { motion } from "framer-motion";
import { springGentle, fadeInUp } from "@/lib/animationPresets";
import { SpringButton } from "@/components/ui/SpringButton";
import { PageTransitionOverlay } from "@/components/ui/PageTransitionOverlay";
import { useNavTransition } from "@/hooks/useNavTransition";

export function HeroSection() {
  const { leaving, navigate } = useNavTransition();

  return (
    <div className="flex flex-col items-center justify-center gap-10 text-center px-6">
      <PageTransitionOverlay leaving={leaving} />

      {/* Main headline */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ ...springGentle, delay: 0.3 }}
        className="flex flex-col gap-3"
      >
        <h1 className="text-4xl md:text-6xl font-extralight tracking-[0.08em] text-white/90">
          送给
          <motion.span
            className="font-light text-white"
            animate={{
              opacity: [1, 1.0, 0.75, 1],
            }}
            transition={{
              delay: 0.5,
              duration: 1.2,
              times: [0, 0.3, 0.7, 1],
              ease: "easeInOut",
            }}
          >
            TA
          </motion.span>
          的一份特别祝福
        </h1>
        <motion.p
          className="text-sm md:text-base tracking-[0.2em] text-white/45 font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...springGentle, delay: 0.7 }}
        >
          可定制 · 可分享 · 沉浸式体验
        </motion.p>
        <motion.p
          className="text-xs md:text-sm tracking-[0.2em]"
          style={{ color: "rgba(255,255,255,0.30)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...springGentle, delay: 1.0 }}
        >
          有些话说不出口，就让代码替你表达
        </motion.p>
      </motion.div>

      {/* Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 items-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springGentle, delay: 1.4 }}
      >
        <SpringButton variant="primary" onClick={() => navigate("/create")}>
          立即制作
        </SpringButton>
        <SpringButton variant="secondary" onClick={() => navigate("/demo")}>
          先看看效果
        </SpringButton>
      </motion.div>
    </div>
  );
}
