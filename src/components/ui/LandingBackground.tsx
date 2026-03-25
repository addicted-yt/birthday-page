"use client";
import { useEffect, useRef } from "react";

interface LStar { x:number;y:number;r:number;opacity:number;twinkleSpeed:number;twinkleOffset:number;driftX:number;driftY:number; }
interface LParticle { x:number;y:number;vx:number;vy:number;r:number;opacity:number;life:number;maxLife:number; }
interface LMeteor { x:number;y:number;vx:number;vy:number;len:number;opacity:number;life:number;maxLife:number; }

export function LandingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const stars: LStar[] = [];
    const particles: LParticle[] = [];
    const meteors: LMeteor[] = [];
    let nextMeteor = 80 + Math.random() * 150;
    let nextParticle = 0;

    const rays = [
      { x: 0.38, angle: -0.18, width: 0.18, opacity: 0.06, speed: 0.004, phase: 0 },
      { x: 0.62, angle: 0.12,  width: 0.14, opacity: 0.05, speed: 0.003, phase: Math.PI },
      { x: 0.50, angle: 0.0,   width: 0.22, opacity: 0.04, speed: 0.005, phase: Math.PI * 0.7 },
    ];

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 280; i++) {
      const bright = Math.random() < 0.15;
      const big = Math.random() < 0.06;
      stars.push({
        x: Math.random(), y: Math.random(),
        r: big ? Math.random()*1.8+1.0 : bright ? Math.random()*1.0+0.5 : Math.random()*0.7+0.1,
        opacity: big ? 0.7+Math.random()*0.25 : bright ? 0.35+Math.random()*0.3 : Math.random()*0.22+0.04,
        twinkleSpeed: Math.random()*0.012+0.003,
        twinkleOffset: Math.random()*Math.PI*2,
        driftX: (Math.random()-0.5)*0.00003,
        driftY: (Math.random()-0.5)*0.00003,
      });
    }

    const spawnMeteor = () => {
      const angle = (Math.random()*35+10)*(Math.PI/180);
      const speed = 10+Math.random()*8;
      meteors.push({
        x: Math.random()*0.75+0.05, y: Math.random()*0.3,
        vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
        len: 100+Math.random()*140, opacity: 0.7+Math.random()*0.25,
        life: 0, maxLife: 45+Math.random()*30,
      });
    };

    const spawnParticle = () => {
      particles.push({
        x: 0.3+Math.random()*0.4, y: 0.6+Math.random()*0.3,
        vx: (Math.random()-0.5)*0.0003, vy: -(Math.random()*0.0005+0.0001),
        r: Math.random()*1.5+0.5, opacity: 0.4+Math.random()*0.4,
        life: 0, maxLife: 200+Math.random()*200,
      });
    };

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bg = ctx.createRadialGradient(canvas.width*0.5, canvas.height*0.42, 0, canvas.width*0.5, canvas.height*0.5, canvas.width*0.95);
      bg.addColorStop(0, "rgba(18,26,70,1)");
      bg.addColorStop(0.3, "rgba(10,16,45,1)");
      bg.addColorStop(0.7, "rgba(6,10,25,1)");
      bg.addColorStop(1, "rgba(3,5,15,1)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const ray of rays) {
        const breath = Math.sin(t*ray.speed+ray.phase)*0.4+0.6;
        const rx = canvas.width*ray.x;
        const topY = canvas.height*0.35, botY = canvas.height*1.05;
        const halfW = canvas.width*ray.width*breath;
        const tilt = Math.tan(ray.angle)*(botY-topY);
        const rg = ctx.createLinearGradient(rx, topY, rx, botY);
        rg.addColorStop(0, `rgba(120,150,255,${ray.opacity*breath})`);
        rg.addColorStop(0.5, `rgba(80,100,200,${ray.opacity*breath*0.5})`);
        rg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.moveTo(rx, topY); ctx.lineTo(rx+halfW+tilt, botY); ctx.lineTo(rx-halfW+tilt, botY);
        ctx.closePath(); ctx.fillStyle = rg; ctx.fill();
      }

      const breathe = Math.sin(t*0.005)*0.015+0.038;
      const halos = [
        { cx:0.18, cy:0.22, r:0.35, c:`rgba(60,85,200,${breathe})` },
        { cx:0.82, cy:0.58, r:0.28, c:`rgba(100,55,165,${breathe*0.9})` },
        { cx:0.50, cy:0.50, r:0.40, c:`rgba(30,60,150,${breathe*0.6})` },
        { cx:0.65, cy:0.20, r:0.20, c:`rgba(80,120,220,${breathe*0.7})` },
      ];
      for (const h of halos) {
        const halo = ctx.createRadialGradient(canvas.width*h.cx, canvas.height*h.cy, 0, canvas.width*h.cx, canvas.height*h.cy, canvas.width*h.r);
        halo.addColorStop(0, h.c); halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo; ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const cg = Math.sin(t*0.007)*0.018+0.030;
      const centerGlow = ctx.createRadialGradient(canvas.width*0.5, canvas.height*0.44, 0, canvas.width*0.5, canvas.height*0.44, canvas.width*0.25);
      centerGlow.addColorStop(0, `rgba(140,160,255,${cg})`); centerGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = centerGlow; ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        s.x += s.driftX; s.y += s.driftY;
        if (s.x<0) s.x=1; if (s.x>1) s.x=0; if (s.y<0) s.y=1; if (s.y>1) s.y=0;
        const twinkle = Math.sin(t*s.twinkleSpeed+s.twinkleOffset)*0.18;
        const op = Math.max(0, Math.min(1, s.opacity+twinkle));
        const sx = s.x*canvas.width, sy = s.y*canvas.height;
        if (s.r > 1.0 && op > 0.4) {
          const glow = ctx.createRadialGradient(sx,sy,0,sx,sy,s.r*4);
          glow.addColorStop(0, `rgba(220,230,255,${op*0.35})`); glow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sx,sy,s.r*4,0,Math.PI*2); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(sx,sy,s.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(220,230,255,${op})`; ctx.fill();
      }

      nextMeteor--;
      if (nextMeteor <= 0) { spawnMeteor(); nextMeteor = 100+Math.random()*200; }
      for (let i = meteors.length-1; i >= 0; i--) {
        const m = meteors[i]; m.life++;
        const progress = m.life/m.maxLife;
        const fade = progress<0.12 ? progress/0.12 : progress>0.65 ? 1-(progress-0.65)/0.35 : 1;
        const op = m.opacity*fade;
        const sx=m.x*canvas.width, sy=m.y*canvas.height;
        m.x += m.vx/canvas.width; m.y += m.vy/canvas.height;
        const ex=m.x*canvas.width, ey=m.y*canvas.height;
        const tailX=sx-(m.vx/canvas.width)*m.len, tailY=sy-(m.vy/canvas.height)*m.len;
        const mg=ctx.createLinearGradient(tailX,tailY,ex,ey);
        mg.addColorStop(0,"rgba(255,255,255,0)");
        mg.addColorStop(0.5,`rgba(180,205,255,${op*0.45})`);
        mg.addColorStop(1,`rgba(255,255,255,${op})`);
        ctx.beginPath(); ctx.moveTo(tailX,tailY); ctx.lineTo(ex,ey);
        ctx.strokeStyle=mg; ctx.lineWidth=1.5; ctx.stroke();
        if (m.life >= m.maxLife) meteors.splice(i,1);
      }

      nextParticle--;
      if (nextParticle <= 0) { spawnParticle(); nextParticle = 18+Math.random()*25; }
      for (let i = particles.length-1; i >= 0; i--) {
        const p = particles[i]; p.life++; p.x+=p.vx; p.y+=p.vy;
        const progress = p.life/p.maxLife;
        const fade = progress<0.1 ? progress/0.1 : progress>0.75 ? 1-(progress-0.75)/0.25 : 1;
        const op = p.opacity*fade;
        const px=p.x*canvas.width, py=p.y*canvas.height;
        const pg=ctx.createRadialGradient(px,py,0,px,py,p.r*3);
        pg.addColorStop(0,`rgba(160,190,255,${op})`); pg.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(px,py,p.r*3,0,Math.PI*2); ctx.fill();
        if (p.life>=p.maxLife || p.y<0) particles.splice(i,1);
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}
