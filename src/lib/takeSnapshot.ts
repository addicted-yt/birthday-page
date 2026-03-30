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
// data: 图片（base64）跳过，重置 src 在移动端会导致图片消失
function patchCrossOrigin(container: HTMLElement): () => void {
  const patched: Array<{ el: HTMLImageElement; prev: string | null }> = [];
  container.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    if (img.src.startsWith("data:")) return; // base64 跳过
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
function renderStaticStarBackground(clonedDoc: Document, width: number, height: number): void {
  // 找到 CosmicBackground 的 canvas，替换为静态 div
  const canvases = clonedDoc.querySelectorAll<HTMLCanvasElement>("canvas");
  canvases.forEach((canvas) => {
    const div = clonedDoc.createElement("div");
    div.style.cssText = canvas.style.cssText;
    div.style.position = "fixed";
    div.style.inset = "0";
    div.style.zIndex = "0";
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    // 深色星空渐变背景
    div.style.background = `
      radial-gradient(ellipse at 22% 28%, rgba(70,95,210,0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 62%, rgba(120,70,185,0.07) 0%, transparent 45%),
      radial-gradient(ellipse at 55% 75%, rgba(40,130,195,0.06) 0%, transparent 40%),
      radial-gradient(ellipse at 85% 18%, rgba(50,100,200,0.05) 0%, transparent 38%),
      radial-gradient(ellipse at 50% 30%, rgba(18,26,65,1) 0%, rgba(10,16,36,1) 45%, rgba(6,10,24,1) 100%)
    `;
    // 用 box-shadow 模拟星星
    const starShadows: string[] = [];
    // 用固定种子生成伪随机星星，保证每次一致
    const rng = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 200; i++) {
      const sx = Math.floor(rng(i * 3 + 1) * width);
      const sy = Math.floor(rng(i * 3 + 2) * height);
      const op = (rng(i * 3 + 3) * 0.5 + 0.1).toFixed(2);
      const size = rng(i * 7) > 0.85 ? 2 : 1;
      starShadows.push(`${sx}px ${sy}px 0 ${size}px rgba(220,230,255,${op})`);
    }
    const starEl = clonedDoc.createElement("div");
    starEl.style.cssText = `
      position: absolute;
      inset: 0;
      width: 1px;
      height: 1px;
      box-shadow: ${starShadows.join(",")};
    `;
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

  // 2. 用 onclone 在克隆副本里处理所有截图问题，真实 DOM 不受影响
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

      // 信件幕：screenshotMode 下让 section 高度自适应
      clonedContainer.querySelectorAll<HTMLElement>("section").forEach((section) => {
        if (section.style.height === "100dvh" || getComputedStyle(section).height.includes("dvh")) {
          // 所有 section 最小高度保持屏幕高，但允许撑高
          section.style.minHeight = section.style.height || "100vh";
          section.style.height = "auto";
        }
      });

      // 替换 backdrop-filter（html2canvas 不支持）
      clonedContainer.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const computed = window.getComputedStyle(el);
        const bf =
          computed.backdropFilter ||
          (computed as unknown as Record<string, string>)["webkitBackdropFilter"] ||
          "";
        if (bf && bf !== "none") {
          el.style.background = "#0d1020";
          el.style.backdropFilter = "none";
          (el.style as unknown as Record<string, string>)["webkitBackdropFilter"] = "none";
        }
      });

      // 修复 Next.js Image（EmojiImage 等）在 clone 里尺寸失控问题
      // Next.js Image 会生成带 width/height 属性的 img，但 clone 里样式可能丢失
      clonedContainer.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
        const w = img.getAttribute("width");
        const h = img.getAttribute("height");
        if (w && h) {
          img.style.width = `${w}px`;
          img.style.height = `${h}px`;
          img.style.maxWidth = `${w}px`;
          img.style.objectFit = "contain";
        }
      });

      // 隐藏所有 fixed 定位的 UI 覆盖层（按钮、弹窗等）
      clonedContainer.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const pos = window.getComputedStyle(el).position;
        if (pos === "fixed") {
          el.style.display = "none";
        }
      });

      // 绘制静态星空背景替代 canvas 动画
      renderStaticStarBackground(clonedDoc, totalWidth, clonedContainer.scrollHeight);
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
