"use client";
import { useEffect, useRef } from "react";

interface SubtleStar {
  x: number; y: number; r: number;
  opacity: number; twinkleSpeed: number; twinkleOffset: number;
}

export function SubtleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const stars: SubtleStar[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // 130 颗星，opacity 上限提高，整体微微提亮
    for (let i = 0; i < 130; i++) {
      stars.push({
        x: Math.random(), y: Math.random(),
        r: Math.random() * 0.85 + 0.15,
        opacity: Math.random() * 0.28 + 0.06,
        twinkleSpeed: Math.random() * 0.007 + 0.002,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 背景微微提亮
      const grad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.3, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.9
      );
      grad.addColorStop(0, "rgba(16,22,56,1)");
      grad.addColorStop(0.5, "rgba(10,14,34,1)");
      grad.addColorStop(1, "rgba(6,9,22,1)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 中央星云光晕
      const breathe = Math.sin(t * 0.005) * 0.010 + 0.022;
      const halo = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.35, 0,
        canvas.width * 0.5, canvas.height * 0.35, canvas.width * 0.45
      );
      halo.addColorStop(0, `rgba(60,85,190,${breathe})`);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        const twinkle = Math.sin(t * s.twinkleSpeed + s.twinkleOffset) * 0.10;
        const op = Math.max(0, Math.min(1, s.opacity + twinkle));
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(215,225,255,${op})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
