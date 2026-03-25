"use client";
import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  driftX: number;
  driftY: number;
  glow: boolean;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const stars: Star[] = [];
    const meteors: Meteor[] = [];
    let nextMeteor = 200 + Math.random() * 300;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // 320 颗星，18% 大星带光晕，整体更密更亮
    for (let i = 0; i < 320; i++) {
      const big = Math.random() < 0.18;
      const glow = big && Math.random() < 0.5;
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: big ? Math.random() * 1.6 + 1.0 : Math.random() * 0.9 + 0.15,
        opacity: big ? Math.random() * 0.55 + 0.25 : Math.random() * 0.35 + 0.08,
        twinkleSpeed: Math.random() * 0.012 + 0.003,
        twinkleOffset: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.000035,
        driftY: (Math.random() - 0.5) * 0.000035,
        glow,
      });
    }

    const spawnMeteor = () => {
      const angle = (Math.random() * 30 + 15) * (Math.PI / 180);
      const speed = 8 + Math.random() * 6;
      meteors.push({
        x: Math.random() * 0.7 + 0.05,
        y: Math.random() * 0.35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 90 + Math.random() * 120,
        opacity: 0.65 + Math.random() * 0.3,
        life: 0,
        maxLife: 55 + Math.random() * 30,
      });
    };

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 屏幕尺寸感知：小屏幕自动降低强度，大屏幕保持完整效果
      // 390px(手机) → scale=0.45，768px(平板) → scale=0.72，1440px+(桌面) → scale=1.0
      const screenScale = Math.min(1.0, Math.max(0.45,
        canvas.width <= 390 ? 0.45 :
        canvas.width >= 1440 ? 1.0 :
        0.45 + (canvas.width - 390) / (1440 - 390) * 0.55
      ));
      // 中心压暗基准：小屏阅读区更需要留白
      const centerDimBase = 0.42 - (1 - screenScale) * 0.12; // 小屏最低压到30%

      // 背景：中心微微提亮
      const grad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.3, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.9
      );
      grad.addColorStop(0, "rgba(18,26,65,1)");
      grad.addColorStop(0.45, "rgba(10,16,36,1)");
      grad.addColorStop(1, "rgba(6,10,24,1)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 星云光晕：强度随屏幕缩放
      const breatheBase = Math.sin(t * 0.006) * 0.015 + 0.035;
      const breathe = breatheBase * screenScale;
      const haloData = [
        { cx: 0.22, cy: 0.28, r: 0.32, c: `rgba(70,95,210,${breathe})` },
        { cx: 0.80, cy: 0.62, r: 0.28, c: `rgba(120,70,185,${breathe * 0.9})` },
        { cx: 0.55, cy: 0.75, r: 0.24, c: `rgba(40,130,195,${breathe * 0.75})` },
        // 右上角冷蓝云气
        { cx: 0.85, cy: 0.18, r: 0.22, c: `rgba(50,100,200,${breathe * 0.6})` },
      ];
      for (const h of haloData) {
        const halo = ctx.createRadialGradient(
          canvas.width * h.cx, canvas.height * h.cy, 0,
          canvas.width * h.cx, canvas.height * h.cy, canvas.width * h.r
        );
        halo.addColorStop(0, h.c);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 绘制星星
      for (const s of stars) {
        s.x += s.driftX;
        s.y += s.driftY;
        if (s.x < 0) s.x = 1;
        if (s.x > 1) s.x = 0;
        if (s.y < 0) s.y = 1;
        if (s.y > 1) s.y = 0;
        const twinkle = Math.sin(t * s.twinkleSpeed + s.twinkleOffset) * 0.18;
        // 中心阅读区域压暗，小屏幕压得更狠
        const dx = Math.abs(s.x - 0.5) / 0.5; // 0=中心，1=边缘
        const dy = Math.abs(s.y - 0.5) / 0.5;
        const edgeFactor = Math.min(1, (dx * 0.6 + dy * 0.4) * 1.4);
        const centerDim = centerDimBase + edgeFactor * (1 - centerDimBase);
        // 星星整体亮度随屏幕缩放
        const op = Math.max(0, Math.min(1, (s.opacity + twinkle) * centerDim * screenScale));
        const px = s.x * canvas.width;
        const py = s.y * canvas.height;
        // 星星半径也随屏幕缩放（小屏幕星点更小）
        const sr = s.r * (0.7 + screenScale * 0.3);

        // 亮星加光晕（小屏幕光晕更收敛）
        if (s.glow) {
          const glowRadius = sr * (3.5 + screenScale * 1.0);
          const grd = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
          grd.addColorStop(0, `rgba(200,215,255,${op * 0.45 * screenScale})`);
          grd.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(px, py, sr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,230,255,${op})`;
        ctx.fill();
      }

      // 流星：小屏幕降低频率、缩短长度、降低不透明度
      nextMeteor--;
      if (nextMeteor <= 0) {
        spawnMeteor();
        // 小屏幕流星间隔更长
        nextMeteor = (280 + Math.random() * 420) / screenScale;
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life++;
        const progress = m.life / m.maxLife;
        const fade = progress < 0.15 ? progress / 0.15 : progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
        const op = m.opacity * fade * screenScale;
        const sx = m.x * canvas.width;
        const sy = m.y * canvas.height;
        m.x += m.vx / canvas.width;
        m.y += m.vy / canvas.height;
        const ex = m.x * canvas.width;
        const ey = m.y * canvas.height;
        // 流星尾巴长度也随屏幕缩放
        const mLen = m.len * (0.6 + screenScale * 0.4);
        const tailX = sx - (m.vx / canvas.width) * mLen;
        const tailY = sy - (m.vy / canvas.height) * mLen;
        const mg = ctx.createLinearGradient(tailX, tailY, ex, ey);
        mg.addColorStop(0, `rgba(255,255,255,0)`);
        mg.addColorStop(0.6, `rgba(200,215,255,${op * 0.45})`);
        mg.addColorStop(1, `rgba(255,255,255,${op})`);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = mg;
        ctx.lineWidth = 1.4 * (0.7 + screenScale * 0.3);
        ctx.stroke();
        if (m.life >= m.maxLife) meteors.splice(i, 1);
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
