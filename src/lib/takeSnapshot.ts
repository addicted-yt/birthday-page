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
  const scale = isMobile ? 1 : 1.5;

  // ── 1. crossOrigin：只设 attribute，不重置 src ──────────────────────
  container.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    if (!img.src.startsWith("data:") && !img.crossOrigin) {
      img.setAttribute("crossorigin", "anonymous");
    }
  });

  // ── 1b. SVG data URL → PNG data URL（html2canvas 移动端不支持 SVG img）──
  // 只转换 data:image/svg+xml，跳过已经是 png/jpeg 的 data URL 和网络图片
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
        tmpImg.onerror = () => {
          // SVG 转换失败：降级保留原 src，不阻断截图流程
          img.src = svgSrc;
          resolve();
        };
        tmpImg.src = svgSrc;
      });
    })
  );

  await new Promise((r) => setTimeout(r, 600));

  // ── 2. 在真实 DOM 上找所有 fixed 元素，临时隐藏 ─────────────────────
  // 用真实 DOM 的 getComputedStyle，100% 准确（Tailwind className 也能检测到）
  const hiddenEls: Array<{ el: HTMLElement; prev: string }> = [];
  document.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (el === container || container.contains(el)) {
      // container 内部的 fixed 元素（按钮、提示语等）
      if (window.getComputedStyle(el).position === "fixed") {
        hiddenEls.push({ el, prev: el.style.display });
        el.style.display = "none";
      }
    } else {
      // container 外部的 fixed 元素（portal 弹窗等）
      if (window.getComputedStyle(el).position === "fixed") {
        hiddenEls.push({ el, prev: el.style.display });
        el.style.display = "none";
      }
    }
  });

  // ── 3. 临时展开容器，读取真实总高度，再恢复 ─────────────────────────
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

  try {
    const canvas = await html2canvas(container, {
      useCORS: true,
      allowTaint: false,
      scale,
      backgroundColor: "#080d1a",
      logging: false,
      onclone: (clonedDoc, clonedContainer) => {
        // ── A. 展开 scroll-snap 容器 ────────────────────────────────────
        clonedContainer.style.height = "auto";
        clonedContainer.style.minHeight = "auto";
        clonedContainer.style.overflowY = "visible";
        clonedContainer.style.overflowX = "visible";
        clonedContainer.style.scrollSnapType = "none";
        clonedContainer.style.position = "relative";
        // 星空渐变背景（替代 canvas 动画，确保截图有正确的深蓝底色）
        clonedContainer.style.background = [
          `radial-gradient(ellipse ${Math.round(totalWidth*0.6)}px ${Math.round(totalHeight*0.18)}px at ${Math.round(totalWidth*0.22)}px ${Math.round(totalHeight*0.05)}px, rgba(70,95,210,0.18) 0%, transparent 100%)`,
          `radial-gradient(ellipse ${Math.round(totalWidth*0.5)}px ${Math.round(totalHeight*0.15)}px at ${Math.round(totalWidth*0.80)}px ${Math.round(totalHeight*0.30)}px, rgba(120,70,185,0.14) 0%, transparent 100%)`,
          `radial-gradient(ellipse ${Math.round(totalWidth*0.45)}px ${Math.round(totalHeight*0.12)}px at ${Math.round(totalWidth*0.55)}px ${Math.round(totalHeight*0.60)}px, rgba(40,130,195,0.10) 0%, transparent 100%)`,
          `radial-gradient(ellipse ${Math.round(totalWidth*0.4)}px ${Math.round(totalHeight*0.10)}px at ${Math.round(totalWidth*0.85)}px ${Math.round(totalHeight*0.85)}px, rgba(50,100,200,0.08) 0%, transparent 100%)`,
          "linear-gradient(180deg, #0a1224 0%, #080d1a 30%, #060a18 100%)",
        ].join(",");

        // ── B. 展开所有 section ─────────────────────────────────────────
        clonedContainer.querySelectorAll<HTMLElement>("section").forEach((s) => {
          s.style.minHeight = "100vh";
          s.style.height = "auto";
        });

        // ── C. 替换 backdrop-filter ─────────────────────────────────────
        // inline style 里有 backdropFilter 的元素（Framer Motion style prop）
        clonedContainer.querySelectorAll<HTMLElement>("*").forEach((el) => {
          const s = el.style;
          const bf = s.backdropFilter || (s as unknown as Record<string,string>).webkitBackdropFilter || "";
          if (bf && bf !== "none") {
            s.backdropFilter = "none";
            (s as unknown as Record<string,string>).webkitBackdropFilter = "none";
            // 有图片子元素的不补背景（保护卡片图片）
            if (!el.querySelector("img")) {
              s.background = "rgba(13,16,32,0.95)";
            }
          }
        });

        // ── D. 修复 EmojiImage（/emoji/ 路径）尺寸 ──────────────────────
        // Next.js Image 在 clone 里 CSS class 失效，inline style 可能是 width:auto
        // 用 src 路径识别 emoji img，从真实 DOM 读取渲染尺寸后强制覆盖
        clonedContainer.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
          const src = img.getAttribute("src") || img.src || "";
          if (src.includes("/emoji/")) {
            // 从 width/height attribute 读取目标尺寸（Next.js Image 会写入）
            // 如果 attribute 不存在，从 naturalWidth 或默认值兜底
            const attrW = img.getAttribute("width");
            const attrH = img.getAttribute("height");
            const size = attrW ? `${attrW}px` : attrH ? `${attrH}px` : "48px";
            // 用 setProperty + important 确保覆盖 Next.js 注入的 width:auto
            img.style.setProperty("width", size, "important");
            img.style.setProperty("height", size, "important");
            img.style.setProperty("max-width", size, "important");
            img.style.setProperty("max-height", size, "important");
            img.style.setProperty("min-width", size, "important");
            img.style.setProperty("min-height", size, "important");
            img.style.setProperty("object-fit", "contain", "important");
            img.style.setProperty("position", "static", "important");
            img.style.setProperty("display", "block", "important");
            img.style.setProperty("flex-shrink", "0", "important");
            // 修复父 SPAN（Next.js Image wrapper）
            const parent = img.parentElement;
            if (parent && parent.tagName === "SPAN") {
              parent.style.setProperty("width", size, "important");
              parent.style.setProperty("height", size, "important");
              parent.style.setProperty("max-width", size, "important");
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
        // 同时移除克隆文档中可能存在的 canvas 元素（CosmicBackground 动画 canvas）
        clonedDoc.querySelectorAll<HTMLCanvasElement>("canvas").forEach((cv) => cv.remove());
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
