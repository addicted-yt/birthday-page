"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { springGentle } from "@/lib/animationPresets";
import { EmojiImage } from "@/components/ui/EmojiImage";

interface GiftParticle {
  id: number;
  x: number;
  y: number;
  emoji: "balloon" | "confetti" | "tada";
  rotation: number;
  scale: number;
}

interface Scene4GiftProps {
  onOpen: () => void;
  onEnter?: () => void;
}

export function Scene4Gift({ onOpen, onEnter }: Scene4GiftProps) {
  const [opened, setOpened] = useState(false);
  const [particles, setParticles] = useState<GiftParticle[]>([]);
  const hasOpened = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const touchStartY = useRef(0);
  const onEnterRef = useRef(onEnter);

  useEffect(() => {
    onEnterRef.current = onEnter;
  }, [onEnter]);

  // 进入视口时通知外部（用于停止 birthdaySong）
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onEnterRef.current?.(); },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // 未打开时阻止向下滚动（wheel + touchmove）
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!hasOpened.current && e.deltaY > 0) e.preventDefault();
    };
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!hasOpened.current) {
        const dy = touchStartY.current - e.touches[0].clientY;
        if (dy > 0) e.preventDefault(); // 向下滑
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  const handleOpen = () => {
    if (hasOpened.current) return;
    hasOpened.current = true;
    setOpened(true);

    const emojis: GiftParticle["emoji"][] = ["balloon", "confetti", "tada"];
    const newParticles: GiftParticle[] = Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 380,
      y: -(Math.random() * 300 + 60),
      emoji: emojis[i % 3],
      rotation: (Math.random() - 0.5) * 480,
      scale: Math.random() * 0.9 + 0.6,
    }));
    setParticles(newParticles);

    setTimeout(() => onOpen(), 1400);
  };

  return (
    <section
      ref={sectionRef}
      className="scroll-snap-start flex items-center justify-center relative"
      style={{ zIndex: 10, touchAction: opened ? "auto" : "none" }}
    >
      <div className="flex flex-col items-center gap-8 relative">
        {/* 粒子 */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute pointer-events-none"
              style={{ zIndex: 5 + (p.id % 10) }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale, rotate: p.rotation }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <EmojiImage emoji={p.emoji} size={36} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 提示 */}
        <motion.p
          className="font-light select-none"
          style={{ fontSize: "clamp(0.82rem, 1.6vw, 1rem)", letterSpacing: "0.35em", color: "rgba(255,255,255,0.32)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ ...springGentle, delay: 0.5 }}
        >
          {opened ? "" : "轻触打开"}
        </motion.p>

        {/* 礼物 + 光晕 */}
        <motion.div
          className="relative cursor-pointer select-none"
          style={{ zIndex: 10 }}
          initial={{ opacity: 0, scale: 0.75, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...springGentle, delay: 0.7 }}
          whileHover={opened ? {} : { scale: 1.07 }}
          whileTap={opened ? {} : { scale: 0.92 }}
          onClick={handleOpen}
        >
          {/* 脉冲光环 */}
          {!opened && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(160,140,255,0.12) 0%, transparent 70%)",
                  transform: "scale(2.2)",
                }}
                animate={{ scale: [2.2, 3.0, 2.2], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(160,140,255,0.08) 0%, transparent 70%)",
                  transform: "scale(1.6)",
                }}
                animate={{ scale: [1.6, 2.4, 1.6], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              />
            </>
          )}

          <motion.div
            animate={
              opened
                ? { scale: 1.15, rotate: 0 }
                : { scale: [1, 1.01, 1], rotate: 0 }
            }
            transition={
              opened
                ? { type: "tween", duration: 0.55, ease: [0.2, 0, 0.1, 1.5] }
                : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <EmojiImage emoji="gift" size={128} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
