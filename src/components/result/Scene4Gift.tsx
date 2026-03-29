"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, type MutableRefObject } from "react";
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
  onTap?: () => void;  // 点击瞬间触发（早于 onOpen 的 1400ms 延迟）
  onEnter?: () => void;
  sectionRef?: MutableRefObject<HTMLElement | null>;
}

export function Scene4Gift({ onOpen, onTap, onEnter, sectionRef: externalSectionRef }: Scene4GiftProps) {
  const [opened, setOpened] = useState(false);
  const [particles, setParticles] = useState<GiftParticle[]>([]);
  const hasOpened = useRef(false);
  const internalSectionRef = useRef<HTMLElement | null>(null);
  const touchStartY = useRef(0);
  const giftTouchStart = useRef<{ x: number; y: number } | null>(null);
  const giftTapRef = useRef(true);
  const onEnterRef = useRef(onEnter);
  const onTapRef = useRef(onTap);

  useEffect(() => {
    onEnterRef.current = onEnter;
    onTapRef.current = onTap;
  }, [onEnter, onTap]);

  // 预加载粒子图片，避免移动端首次点击时图片未加载导致粒子不显示
  useEffect(() => {
    const urls = ["/emoji/balloon.png", "/emoji/confetti_ball.png", "/emoji/tada.png"];
    urls.forEach((url) => {
      const img = new window.Image();
      img.src = url;
    });
  }, []);

  // 进入视口时通知外部（用于停止 birthdaySong）
  useEffect(() => {
    const el = internalSectionRef.current;
    if (!el) return;
    const scrollRoot = el.closest(".scroll-snap-y");
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onEnterRef.current?.(); },
      {
        root: scrollRoot instanceof Element ? scrollRoot : null,
        threshold: [0.2, 0.35, 0.5],
      }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // 未打开时阻止向下滚动（wheel + touchmove）
  useEffect(() => {
    const el = internalSectionRef.current;
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
    onTapRef.current?.();  // 立即通知外部（启动 piano、停止 birthday song），不等粒子动画

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

  const handleGiftTouchStart = (event: React.TouchEvent) => {
    giftTouchStart.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
    giftTapRef.current = true;
  };

  const handleGiftTouchMove = (event: React.TouchEvent) => {
    if (!giftTouchStart.current) return;
    const dx = Math.abs(event.touches[0].clientX - giftTouchStart.current.x);
    const dy = Math.abs(event.touches[0].clientY - giftTouchStart.current.y);
    if (dx > 10 || dy > 10) {
      giftTapRef.current = false;
    }
  };

  const handleGiftTouchEnd = () => {
    if (giftTapRef.current) {
      handleOpen();
    }
    giftTouchStart.current = null;
  };

  return (
    <section
      ref={(node) => {
        internalSectionRef.current = node;
        if (externalSectionRef) {
          externalSectionRef.current = node;
        }
      }}
      className="scroll-snap-start flex items-center justify-center relative"
      style={{ zIndex: 10, touchAction: opened ? "auto" : "none" }}
    >
      <div className="flex flex-col items-center gap-8 relative">
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
          onClick={() => {
            if ("ontouchstart" in window) return; // 触摸设备由 touchend 处理
            handleOpen();
          }}
          onTouchStart={handleGiftTouchStart}
          onTouchMove={handleGiftTouchMove}
          onTouchEnd={handleGiftTouchEnd}
          onTouchCancel={handleGiftTouchEnd}
        >
          {/* 粒子从礼物中心爆出，以礼物盒为定位父元素避免被 scroll 容器裁剪 */}
          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute pointer-events-none"
                style={{ zIndex: 5 + (p.id % 10), top: "50%", left: "50%" }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale, rotate: p.rotation }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
              <EmojiImage emoji={p.emoji} size={36} />
              </motion.div>
            ))}
          </AnimatePresence>

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
            <EmojiImage emoji="gift" size={128} priority />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
