/**
 * takeSnapshot
 * 将结果页所有幕截成一张长图，处理 backdrop-filter 失真和跨域图片问题
 */

import html2canvas from "html2canvas";

// 判断是否是桌面普通浏览器（非微信 / 非移动端）
export function isDesktopBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isWechat = /MicroMessenger/i.test(ua);
  return !isMobile && !isWechat;
}

// 判断是否是桌面微信（非移动端的微信内置浏览器）
export function isDesktopWechat(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isWechat = /MicroMessenger/i.test(ua);
  return isWechat && !isMobile;
}

// 给所有非 data: 的 img 元素加 crossOrigin，避免 R2 图片污染 canvas
function patchCrossOrigin(container: HTMLElement): () => void {
  const patched: Array<{ el: HTMLImageElement; prev: string | null }> = [];
  container.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    if (img.src.startsWith("data:")) return; // base64 跳过，重置会导致移动端图片消失
    if (!img.crossOrigin) {
      patched.push({ el: img, prev: img.getAttribute("crossorigin") });
      img.crossOrigin = "anonymous";
      const src = img.src;
      img.src = "";
      img.src = src;
    }
  });
  return () => {
    patched.forEach(({ el, prev }) => {
      if (prev === null) el.removeAttribute("crossorigin");
      else el.crossOrigin = prev;
    });
  };
}

// 在 clone document 里绘制静态星空背景，替代 canvas 动画
function renderStaticStarBackground(clonedDoc: Document, width: number, totalHeight: number): void {
  const canvases = clonedDoc.querySelectorAll<HTMLCanvasElement>("canvas");
  canvases.forEach((canvas) => {
    const div = clonedDoc.createElement("div");
    // 保持 fixed 定位，让星空铺满每一幕
    div.style.position = "fixed";
    div.style.inset = "0";
    div.style.zIndex = "0";
    div.style.pointerEvents = "none";
    div.style.background = [
      "radial-gradient(ellipse at 22% 28%, rgba(70,95,210,0.10) 0%, transparent 50%)",
      "radial-gradient(ellipse at 80% 62%, rgba(120,70,185,0.09) 0%, transparent 45%)",
      "radial-gradient(ellipse at 55% 75%, rgba(40,130,195,0.07) 0%, transparent 40%)",
      "radial-gradient(ellipse at 85% 18%, rgba(50,100,200,0.06) 0%, transparent 38%)",
      "radial-gradient(ellipse at 50% 30%, rgba(18,26,65,1) 0%, rgba(10,16,36,1) 45%, rgba(6,10,24,1) 100%)",
    ].join(",");

    // 用 box-shadow 模拟星星，分布在整张长图高度上
    const rng = (seed: number) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };
    const shadows: string[] = [];
    for (let i = 0; i < 280; i++) {
      const sx = Math.floor(rng(i * 3 + 1) * width);
      const sy = Math.floor(rng(i * 3 + 2) * totalHeight);
      const op = (rng(i * 3 + 3) * 0.55 + 0.12).toFixed(2);
      const sz = rng(i * 7) > 0.82 ? 2 : 1;
      shadows.push(`${sx}px ${sy}px 0 ${sz}px rgba(220,230,255,${op})`);
    }
    const starEl = clonedDoc.createElement("div");
    starEl.style.position = "absolute";
    starEl.style.top = "0";
    starEl.style.left = "0";
    starEl.style.width = `${width}px`;
    starEl.style.height = `${totalHeight}px`;
    starEl.style.boxShadow = shadows.join(",");
    div.appendChild(starEl);
    canvas.replaceWith(div);
  });
}

export interface SnapshotResult {
  dataUrl: string;
}

export async function takeSnapshot(container: HTMLElement): Promise<SnapshotResult> {
  // 1. 先设置 crossOrigin（跳过 base64），等图片重新加载
  const restoreCrossOrigin = patchCrossOrigin(container);
  await new Promise((r) => setTimeout(r, 500));

  const totalWidth = container.offsetWidth;

  // 2. 在截图前先展开容器读取真实总高，再恢复，把高度传给 onclone
  const prevHeight = container.style.height;
  const prevOverflow = container.style.overflowY;
  const prevSnap = container.style.scrollSnapType;
  container.style.height = "auto";
  container.style.overflowY = "visible";
  container.style.scrollSnapType = "none";
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const totalHeight = container.scrollHeight;
  container.style.height = prevHeight;
  container.style.overflowY = prevOverflow;
  container.style.scrollSnapType = prevSnap;

  // 3. 用 onclone 在克隆副本里处理所有截图问题，真实 DOM 不受影响
  const canvas = await html2canvas(container, {
    useCORS: true,
    allowTaint: false,
    scale: 1,
    backgroundColor: "#080d1a",
    logging: false,
    onclone: (clonedDoc, clonedContainer) => {
      // 展开 scroll-snap 容器
      clonedContainer.style.height = "auto";
      clonedContainer.style.overflowY = "visible";
      clonedContainer.style.scrollSnapType = "none";
      clonedContainer.style.position = "relative";

      // 用 clone document 的 getComputedStyle（不能用 window 的）
      const clonedView = clonedDoc.defaultView ?? window;

      // 替换 backdrop-filter，同时保护卡片图片：
      // 只对没有 img 子元素的容器替换背景，避免把卡片图片盖住
      clonedContainer.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const computed = clonedView.getComputedStyle(el);
        const bf =
          computed.backdropFilter ||
          (computed as unknown as Record<string, string>)["webkitBackdropFilter"] ||
          "";
        if (bf && bf !== "none") {
          el.style.backdropFilter = "none";
          (el.style as unknown as Record<string, string>)["webkitBackdropFilter"] = "none";
          // 只在没有背景图/图片子元素时才补纯色背景
          const hasImgChild = el.querySelector("img") !== null;
          const bgImage = computed.backgroundImage;
          const hasBgImage = bgImage && bgImage !== "none";
          if (!hasImgChild && !hasBgImage) {
            el.style.background = "#0d1020";
          }
        }
      });

      // 修复 Next.js Image（EmojiImage）在 clone 里尺寸失控：
      // 找到带 width/height attribute 且尺寸较小的 img（emoji 类），强制约束
      clonedContainer.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
        const w = img.getAttribute("width");
        const h = img.getAttribute("height");
        if (w && h && Number(w) <= 120 && Number(h) <= 120) {
          // emoji/小图标类，强制限制尺寸
          img.style.width = `${w}px`;
          img.style.height = `${h}px`;
          img.style.maxWidth = `${w}px`;
          img.style.maxHeight = `${h}px`;
          img.style.objectFit = "contain";
          img.style.display = "inline-block";
          img.style.flexShrink = "0";
          // 同时约束父级（Next.js Image 的 span wrapper）
          const parent = img.parentElement;
          if (parent && parent.tagName !== "A" && parent !== clonedContainer) {
            parent.style.width = `${w}px`;
            parent.style.height = `${h}px`;
            parent.style.maxWidth = `${w}px`;
            parent.style.overflow = "hidden";
            parent.style.display = "inline-block";
            parent.style.flexShrink = "0";
          }
        }
      });

      // 隐藏所有 fixed 定位的 UI 覆盖层（按钮、弹窗等）
      clonedContainer.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const pos = clonedView.getComputedStyle(el).position;
        if (pos === "fixed") {
          el.style.display = "none";
        }
      });

      // 绘制静态星空背景替代 canvas 动画
      renderStaticStarBackground(clonedDoc, totalWidth, totalHeight);
    },
  });

  restoreCrossOrigin();

  const dataUrl = canvas.toDataURL("image/png");
  return { dataUrl };
}

// 桌面浏览器：直接触发下载
export function downloadSnapshot(dataUrl: string, filename = "birthday.png") {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
