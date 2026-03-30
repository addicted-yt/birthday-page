/**
 * takeSnapshot
 * 将结果页所有幕截成一张长图，处理 backdrop-filter 失真和跨域图片问题
 */

import html2canvas from "html2canvas";

export function isDesktopBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return !/Android|iPhone|iPad|iPod|Mobile/i.test(ua) && !/MicroMessenger/i.test(ua);
}

export function isDesktopWechat(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /MicroMessenger/i.test(ua) && !/Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}

export interface SnapshotResult {
  dataUrl: string;
}

export async function takeSnapshot(container: HTMLElement): Promise<SnapshotResult> {
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const scale = isMobile ? 1.5 : 2;

  // ── 1. crossOrigin：只设 attribute，不重置 src ──────────────────────
  container.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    if (!img.src.startsWith("data:") && !img.crossOrigin) {
      img.setAttribute("crossorigin", "anonymous");
    }
  });

  // ── 1b. SVG data URL → PNG data URL（html2canvas 移动端不支持 SVG img）──
  await Promise.all(
    Array.from(container.querySelectorAll<HTMLImageElement>("img")).map((img) => {
      if (!img.src.startsWith("data:image/svg")) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const svgSrc = img.src;
        const w = img.naturalWidth || img.offsetWidth || 400;
        const h = img.naturalHeight || img.offsetHeight || 500;
        const cvs = document.createElement("canvas");
        cvs.width = w;
        cvs.height = h;
        const ctx = cvs.getContext("2d");
        if (!ctx) { resolve(); return; }
        const tmpImg = new Image();
        tmpImg.onload = () => {
          ctx.drawImage(tmpImg, 0, 0, w, h);
          img.src = cvs.toDataURL("image/png");
          resolve();
        };
        tmpImg.onerror = () => { img.src = svgSrc; resolve(); };
        tmpImg.src = svgSrc;
      });
    })
  );

  // ── 1c. 预记录真实 DOM 中 emoji img 的渲染尺寸（onclone 里无法可靠读取）──
  // Next.js Image 优化后 src 变成 /_next/image?url=%2Femoji%2F...，需要解码匹配
  const isEmojiSrc = (src: string) => {
    if (src.includes("/emoji/")) return true;
    try { return new URL(src, location.href).searchParams.get("url")?.includes("/emoji/") ?? false; } catch { return false; }
  };
  const emojiSizeMap = new Map<string, { w: number; h: number }>();
  container.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (isEmojiSrc(src)) {
      const rect = img.getBoundingClientRect();
      const w = rect.width > 0 ? rect.width : Number(img.getAttribute("width") || 48);
      const h = rect.height > 0 ? rect.height : Number(img.getAttribute("height") || 48);
      emojiSizeMap.set(src, { w, h });
    }
  });

  await new Promise((r) => setTimeout(r, 600));

  // ── 2. 隐藏所有 fixed 元素，但跳过 CosmicBackground canvas ──────────
  // CosmicBackground 是 fixed canvas，需要排除，不然背景会消失
  const hiddenEls: Array<{ el: HTMLElement; prev: string }> = [];
  document.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (el.tagName === "CANVAS") return; // 保留 canvas（CosmicBackground）
    if (window.getComputedStyle(el).position === "fixed") {
      hiddenEls.push({ el, prev: el.style.display });
      el.style.display = "none";
    }
  });

  // ── 3. 保存 scrollTop，展开容器读总高度，再完整恢复 ─────────────────
  const prevScrollTop = container.scrollTop;
  const prevH = container.style.height;
  const prevOY = container.style.overflowY;
  const prevSnap = container.style.scrollSnapType;
  container.style.height = "auto";
  container.style.overflowY = "visible";
  container.style.scrollSnapType = "none";
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const totalHeight = container.scrollHeight;
  const totalWidth = container.offsetWidth;
  container.style.height = prevH;
  container.style.overflowY = prevOY;
  container.style.scrollSnapType = prevSnap;
  // 恢复 scrollTop，防止移动端卡在第一幕
  container.scrollTop = prevScrollTop;

  try {
    const canvas = await html2canvas(container, {
      useCORS: true,
      allowTaint: false,
      scale,
      backgroundColor: "#080d1a",
      logging: false,
      onclone: (clonedDoc, clonedContainer) => {
        // ── A. 展开 scroll-snap 容器 ────────────────────────────────────
        clonedContainer.style.height = `${totalHeight}px`;
        clonedContainer.style.minHeight = `${totalHeight}px`;
        clonedContainer.style.overflowY = "visible";
        clonedContainer.style.overflowX = "visible";
        clonedContainer.style.scrollSnapType = "none";
        clonedContainer.style.position = "relative";
        // body/html 底色
        clonedDoc.body.style.background = "#080d1a";
        clonedDoc.documentElement.style.background = "#080d1a";
        // 星空渐变背景
        clonedContainer.style.background = [
          `radial-gradient(ellipse ${Math.round(totalWidth*0.6)}px ${Math.round(totalHeight*0.18)}px at ${Math.round(totalWidth*0.22)}px ${Math.round(totalHeight*0.05)}px, rgba(70,95,210,0.18) 0%, transparent 100%)`,
          `radial-gradient(ellipse ${Math.round(totalWidth*0.5)}px ${Math.round(totalHeight*0.15)}px at ${Math.round(totalWidth*0.80)}px ${Math.round(totalHeight*0.30)}px, rgba(120,70,185,0.14) 0%, transparent 100%)`,
          `radial-gradient(ellipse ${Math.round(totalWidth*0.45)}px ${Math.round(totalHeight*0.12)}px at ${Math.round(totalWidth*0.55)}px ${Math.round(totalHeight*0.60)}px, rgba(40,130,195,0.10) 0%, transparent 100%)`,
          `radial-gradient(ellipse ${Math.round(totalWidth*0.4)}px ${Math.round(totalHeight*0.10)}px at ${Math.round(totalWidth*0.85)}px ${Math.round(totalHeight*0.85)}px, rgba(50,100,200,0.08) 0%, transparent 100%)`,
          "linear-gradient(180deg, #0a1224 0%, #080d1a 30%, #060a18 100%)",
        ].join(",");
        // 移除克隆文档里的 canvas（CosmicBackground，clone 里是空白 canvas）
        clonedDoc.querySelectorAll<HTMLCanvasElement>("canvas").forEach((cv) => cv.remove());

        // ── B. 展开所有 section ─────────────────────────────────────────
        clonedContainer.querySelectorAll<HTMLElement>("section").forEach((s) => {
          s.style.minHeight = "100vh";
          s.style.height = "auto";
        });

        // ── C. 替换 backdrop-filter ─────────────────────────────────────
        clonedContainer.querySelectorAll<HTMLElement>("*").forEach((el) => {
          const s = el.style;
          const bf = s.backdropFilter || (s as unknown as Record<string,string>).webkitBackdropFilter || "";
          if (bf && bf !== "none") {
            s.backdropFilter = "none";
            (s as unknown as Record<string,string>).webkitBackdropFilter = "none";
            if (!el.querySelector("img")) {
              s.background = "rgba(13,16,32,0.95)";
            }
          }
        });

        // ── D. 修复 EmojiImage（/emoji/ 路径）尺寸 ──────────────────────
        clonedContainer.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
          const src = img.getAttribute("src") || img.src || "";
          if (isEmojiSrc(src)) {
            const recorded = emojiSizeMap.get(img.getAttribute("src") || "");
            const w = recorded ? recorded.w : Number(img.getAttribute("width") || 48);
            const h = recorded ? recorded.h : Number(img.getAttribute("height") || 48);
            const sw = `${w}px`;
            const sh = `${h}px`;
            img.style.setProperty("width", sw, "important");
            img.style.setProperty("height", sh, "important");
            img.style.setProperty("max-width", sw, "important");
            img.style.setProperty("max-height", sh, "important");
            img.style.setProperty("min-width", sw, "important");
            img.style.setProperty("min-height", sh, "important");
            img.style.setProperty("object-fit", "contain", "important");
            img.style.setProperty("display", "block", "important");
            img.style.setProperty("flex-shrink", "0", "important");
            img.style.removeProperty("position");
            const parent = img.parentElement;
            if (parent && parent.tagName === "SPAN") {
              parent.style.setProperty("width", sw, "important");
              parent.style.setProperty("height", sh, "important");
              parent.style.setProperty("max-width", sw, "important");
              parent.style.setProperty("min-width", sw, "important");
              parent.style.setProperty("overflow", "hidden", "important");
              parent.style.setProperty("display", "inline-block", "important");
              parent.style.setProperty("flex-shrink", "0", "important");
              parent.style.setProperty("position", "relative", "important");
            }
          } else if (!img.getAttribute("width") && !img.getAttribute("height")) {
            // 卡片图片：Tailwind w-full h-full object-cover 在 clone 里可能失效
            const computed = window.getComputedStyle(img);
            if (computed.objectFit === "cover" || img.className.includes("object-cover")) {
              img.style.width = "100%";
              img.style.height = "100%";
              img.style.objectFit = "cover";
              img.style.display = "block";
            }
          }
        });

        // ── D2. 修复卡片容器：Tailwind w-full h-full 在 clone 里失效 ─────
        clonedContainer.querySelectorAll<HTMLElement>(".w-full.h-full").forEach((el) => {
          el.style.width = "100%";
          el.style.height = "100%";
        });

        // ── E. 在容器内插入静态星星覆盖层（box-shadow 散布全图） ────────
        const rng = (n: number) => { const x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };
        const shadows: string[] = [];
        for (let i = 0; i < 300; i++) {
          const sx = Math.floor(rng(i * 3 + 1) * totalWidth);
          const sy = Math.floor(rng(i * 3 + 2) * totalHeight);
          const op = (rng(i * 3 + 3) * 0.55 + 0.12).toFixed(2);
          const sz = rng(i * 7) > 0.82 ? 2 : 1;
          shadows.push(`${sx}px ${sy}px 0 ${sz}px rgba(220,230,255,${op})`);
        }
        const starsEl = clonedDoc.createElement("div");
        starsEl.style.position = "absolute";
        starsEl.style.top = "0";
        starsEl.style.left = "0";
        starsEl.style.width = "1px";
        starsEl.style.height = "1px";
        starsEl.style.zIndex = "1";
        starsEl.style.pointerEvents = "none";
        starsEl.style.boxShadow = shadows.join(",");
        clonedContainer.insertBefore(starsEl, clonedContainer.firstChild);
      },
    });

    return { dataUrl: canvas.toDataURL("image/png") };
  } finally {
    // ── 4. 恢复隐藏的 fixed 元素 ────────────────────────────────────────
    hiddenEls.forEach(({ el, prev }) => { el.style.display = prev; });
  }
}

export function downloadSnapshot(dataUrl: string, filename = "birthday.png") {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
