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

// Next.js Image 优化后 src 是 /_next/image?url=%2Femoji%2F...，需要解码判断
function isEmojiImg(src: string): boolean {
  if (src.includes("/emoji/")) return true;
  try {
    const u = new URL(src, location.href);
    return (u.searchParams.get("url") ?? "").includes("/emoji/");
  } catch {
    return false;
  }
}

export interface SnapshotResult {
  dataUrl: string;
}

export async function takeSnapshot(container: HTMLElement): Promise<SnapshotResult> {
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const scale = isMobile ? 1.5 : 2;

  // ── 1. crossOrigin：只设 attribute，不重置 src（重置会导致移动端图片消失）──
  container.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    if (!img.src.startsWith("data:") && !img.crossOrigin) {
      img.setAttribute("crossorigin", "anonymous");
    }
  });

  // ── 1b. SVG data URL → PNG（html2canvas 移动端不支持 SVG img）────────
  await Promise.all(
    Array.from(container.querySelectorAll<HTMLImageElement>("img")).map((img) => {
      if (!img.src.startsWith("data:image/svg")) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const svgSrc = img.src;
        const w = img.naturalWidth || img.offsetWidth || 400;
        const h = img.naturalHeight || img.offsetHeight || 500;
        const cvs = document.createElement("canvas");
        cvs.width = w; cvs.height = h;
        const ctx = cvs.getContext("2d");
        if (!ctx) { resolve(); return; }
        const tmp = new Image();
        tmp.onload = () => { ctx.drawImage(tmp, 0, 0, w, h); img.src = cvs.toDataURL("image/png"); resolve(); };
        tmp.onerror = () => { img.src = svgSrc; resolve(); };
        tmp.src = svgSrc;
      });
    })
  );

  // ── 1c. 给 emoji img 打标记（data-snap-emoji），onclone 里按标记找，绕开 URL 匹配 ──
  // 用 getBoundingClientRect 读真实渲染尺寸；不可见幕降级用 width/height attribute
  const taggedEmojis: HTMLImageElement[] = [];
  container.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    if (!isEmojiImg(img.getAttribute("src") || img.src || "")) return;
    const rect = img.getBoundingClientRect();
    const w = rect.width > 0 ? Math.round(rect.width) : Number(img.getAttribute("width") || 48);
    const h = rect.height > 0 ? Math.round(rect.height) : Number(img.getAttribute("height") || 48);
    img.setAttribute("data-snap-emoji", `${w},${h}`);
    taggedEmojis.push(img);
  });

  await new Promise((r) => setTimeout(r, 500));

  const totalWidth = container.offsetWidth;

  // ── 2. 展开容器读取真实总高度，保存并恢复 scrollTop 防止卡幕 ─────────
  const prevScrollTop = container.scrollTop;
  const prevH = container.style.height;
  const prevOY = container.style.overflowY;
  const prevSnap = container.style.scrollSnapType;
  container.style.height = "auto";
  container.style.overflowY = "visible";
  container.style.scrollSnapType = "none";
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const totalHeight = container.scrollHeight;
  container.style.height = prevH;
  container.style.overflowY = prevOY;
  container.style.scrollSnapType = prevSnap;
  container.scrollTop = prevScrollTop;

  const canvas = await html2canvas(container, {
    useCORS: true,
    allowTaint: false,
    scale,
    backgroundColor: "#080d1a",
    logging: false,
    onclone: (clonedDoc, clonedContainer) => {
      // ── A. 展开 scroll-snap 容器 ──────────────────────────────────────
      clonedContainer.style.height = "auto";
      clonedContainer.style.overflowY = "visible";
      clonedContainer.style.scrollSnapType = "none";
      clonedContainer.style.position = "relative";

      // ── B. 展开所有 section ───────────────────────────────────────────
      clonedContainer.querySelectorAll<HTMLElement>("section").forEach((s) => {
        s.style.minHeight = "100vh";
        s.style.height = "auto";
      });

      // ── C. 替换 backdrop-filter ───────────────────────────────────────
      const clonedView = clonedDoc.defaultView ?? window;
      clonedContainer.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const computed = clonedView.getComputedStyle(el);
        const bf = computed.backdropFilter || (computed as unknown as Record<string,string>).webkitBackdropFilter || "";
        if (bf && bf !== "none") {
          el.style.backdropFilter = "none";
          (el.style as unknown as Record<string,string>).webkitBackdropFilter = "none";
          if (!el.querySelector("img") && computed.backgroundImage === "none") {
            el.style.background = "#0d1020";
          }
        }
      });

      // ── D. 修复 EmojiImage 尺寸 ───────────────────────────────────────
      // 按 data-snap-emoji 标记找（截图前在真实 DOM 打标，绕开 Next.js URL 变换）
      clonedContainer.querySelectorAll<HTMLImageElement>("img[data-snap-emoji]").forEach((img) => {
        const val = img.getAttribute("data-snap-emoji") || "48,48";
        const [sw, sh] = val.split(",").map((v) => `${v}px`);
        img.style.setProperty("width", sw, "important");
        img.style.setProperty("height", sh, "important");
        img.style.setProperty("max-width", sw, "important");
        img.style.setProperty("max-height", sh, "important");
        img.style.setProperty("min-width", "0", "important");
        img.style.setProperty("min-height", "0", "important");
        img.style.setProperty("object-fit", "contain", "important");
        img.style.setProperty("display", "inline-block", "important");
        img.style.setProperty("flex-shrink", "0", "important");
        img.style.removeProperty("position");
        const parent = img.parentElement;
        if (parent && parent.tagName === "SPAN") {
          parent.style.setProperty("width", sw, "important");
          parent.style.setProperty("height", sh, "important");
          parent.style.setProperty("max-width", sw, "important");
          parent.style.setProperty("overflow", "hidden", "important");
          parent.style.setProperty("display", "inline-block", "important");
          parent.style.setProperty("flex-shrink", "0", "important");
          parent.style.setProperty("position", "relative", "important");
        }
      });

      // ── D2. 修复卡片容器 w-full h-full ───────────────────────────────
      clonedContainer.querySelectorAll<HTMLElement>(".w-full.h-full").forEach((el) => {
        el.style.width = "100%";
        el.style.height = "100%";
      });

      // ── E. 隐藏 fixed UI 元素（在 clone 里操作，不影响真实 DOM）────────
      clonedContainer.querySelectorAll<HTMLElement>("*").forEach((el) => {
        if (clonedView.getComputedStyle(el).position === "fixed") {
          el.style.display = "none";
        }
      });

      // ── F. 替换 canvas 为静态星空背景 ────────────────────────────────
      // 用 absolute 覆盖全图高度（fixed 只覆盖一屏）
      clonedDoc.querySelectorAll<HTMLCanvasElement>("canvas").forEach((cv) => {
        const bg = clonedDoc.createElement("div");
        bg.style.position = "absolute";
        bg.style.top = "0";
        bg.style.left = "0";
        bg.style.width = `${totalWidth}px`;
        bg.style.height = `${totalHeight}px`;
        bg.style.zIndex = "0";
        bg.style.pointerEvents = "none";
        bg.style.background = [
          `radial-gradient(ellipse ${Math.round(totalWidth*0.6)}px ${Math.round(totalHeight*0.18)}px at ${Math.round(totalWidth*0.22)}px ${Math.round(totalHeight*0.05)}px, rgba(70,95,210,0.18) 0%, transparent 100%)`,
          `radial-gradient(ellipse ${Math.round(totalWidth*0.5)}px ${Math.round(totalHeight*0.15)}px at ${Math.round(totalWidth*0.80)}px ${Math.round(totalHeight*0.30)}px, rgba(120,70,185,0.14) 0%, transparent 100%)`,
          `radial-gradient(ellipse ${Math.round(totalWidth*0.45)}px ${Math.round(totalHeight*0.12)}px at ${Math.round(totalWidth*0.55)}px ${Math.round(totalHeight*0.60)}px, rgba(40,130,195,0.10) 0%, transparent 100%)`,
          `radial-gradient(ellipse ${Math.round(totalWidth*0.4)}px ${Math.round(totalHeight*0.10)}px at ${Math.round(totalWidth*0.85)}px ${Math.round(totalHeight*0.85)}px, rgba(50,100,200,0.08) 0%, transparent 100%)`,
          "linear-gradient(180deg, #0a1224 0%, #080d1a 30%, #060a18 100%)",
        ].join(",");
        // 星星：box-shadow 散布全图
        const rng = (n: number) => { const x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };
        const shadows: string[] = [];
        for (let i = 0; i < 280; i++) {
          const sx = Math.floor(rng(i * 3 + 1) * totalWidth);
          const sy = Math.floor(rng(i * 3 + 2) * totalHeight);
          const op = (rng(i * 3 + 3) * 0.55 + 0.12).toFixed(2);
          const sz = rng(i * 7) > 0.82 ? 2 : 1;
          shadows.push(`${sx}px ${sy}px 0 ${sz}px rgba(220,230,255,${op})`);
        }
        const starEl = clonedDoc.createElement("div");
        starEl.style.position = "absolute";
        starEl.style.top = "0";
        starEl.style.left = "0";
        starEl.style.width = "1px";
        starEl.style.height = "1px";
        starEl.style.boxShadow = shadows.join(",");
        bg.appendChild(starEl);
        cv.replaceWith(bg);
      });
    },
  });

  // 清除真实 DOM 上打的临时标记
  taggedEmojis.forEach((img) => img.removeAttribute("data-snap-emoji"));

  return { dataUrl: canvas.toDataURL("image/png") };
}

export function downloadSnapshot(dataUrl: string, filename = "birthday.png") {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
