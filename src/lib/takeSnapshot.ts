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

export interface SnapshotResult {
  dataUrl: string;
}

export async function takeSnapshot(container: HTMLElement): Promise<SnapshotResult> {
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  // 移动端 scale=1 避免内存溢出，桌面端 1.5 提升清晰度
  const scale = isMobile ? 1 : 1.5;

  // 等待所有图片加载完成（包括 crossOrigin 变更后的重载）
  // 先给所有非 data: 图片设置 crossOrigin attribute（不重置 src，避免闪烁）
  container.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    if (!img.src.startsWith("data:") && !img.crossOrigin) {
      img.setAttribute("crossorigin", "anonymous");
    }
  });
  // 等待图片自然加载完
  await new Promise((r) => setTimeout(r, 600));

  const totalWidth = container.offsetWidth;

  // 在 onclone 里完成所有 DOM 改造，真实 DOM 完全不动
  const canvas = await html2canvas(container, {
    useCORS: true,
    allowTaint: false,
    scale,
    backgroundColor: "#080d1a",
    logging: false,
    onclone: (clonedDoc, clonedContainer) => {
      // ── 1. 展开 scroll-snap 容器 ──────────────────────────────────────
      clonedContainer.style.height = "auto";
      clonedContainer.style.minHeight = "auto";
      clonedContainer.style.overflowY = "visible";
      clonedContainer.style.overflowX = "visible";
      clonedContainer.style.scrollSnapType = "none";
      clonedContainer.style.position = "relative";

      // ── 2. 展开所有 section（每幕 height:100dvh → auto） ─────────────
      clonedContainer.querySelectorAll<HTMLElement>("section").forEach((section) => {
        const h = section.style.height || "";
        if (h.includes("dvh") || h.includes("vh") || h === "auto") {
          section.style.minHeight = h.replace("dvh", "vh") || "100vh";
          section.style.height = "auto";
        }
      });

      // ── 3. 替换 backdrop-filter（html2canvas 不支持）──────────────────
      // 只对没有 img 子元素且没有 background-image 的元素补纯色背景
      clonedContainer.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const s = el.style;
        const bf = s.backdropFilter || (s as unknown as Record<string,string>).webkitBackdropFilter || "";
        // 读 inline style 即可（clone 保留了原始 inline style）
        if (bf && bf !== "none") {
          s.backdropFilter = "none";
          (s as unknown as Record<string,string>).webkitBackdropFilter = "none";
          const hasImg = el.querySelector("img") !== null;
          if (!hasImg) {
            s.background = "#0d1020";
          }
        }
      });

      // ── 4. 修复 Next.js Image / EmojiImage 尺寸失控 ──────────────────
      clonedContainer.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
        const w = img.getAttribute("width");
        const h = img.getAttribute("height");
        if (w && h && Number(w) <= 120 && Number(h) <= 120) {
          img.style.width = `${w}px`;
          img.style.height = `${h}px`;
          img.style.maxWidth = `${w}px`;
          img.style.maxHeight = `${h}px`;
          img.style.objectFit = "contain";
          img.style.display = "inline-block";
          img.style.flexShrink = "0";
          // 约束 Next.js Image 的 span wrapper
          const parent = img.parentElement;
          if (parent && parent.tagName === "SPAN") {
            parent.style.width = `${w}px`;
            parent.style.height = `${h}px`;
            parent.style.maxWidth = `${w}px`;
            parent.style.overflow = "hidden";
            parent.style.display = "inline-block";
            parent.style.flexShrink = "0";
          }
        }
      });

      // ── 5. 隐藏 fixed UI 覆盖层（按钮、弹窗等）─────────────────────
      // 用 inline style 判断，避免跨 document getComputedStyle 问题
      clonedContainer.querySelectorAll<HTMLElement>("*").forEach((el) => {
        if (el.style.position === "fixed") {
          el.style.display = "none";
        }
      });
      // 额外处理 Framer Motion 通过 style prop 设置 position:fixed 的元素
      // （这些在 clone 里会保留在 style 属性里）
      clonedDoc.querySelectorAll<HTMLElement>("[style*='position: fixed'],[style*='position:fixed']").forEach((el) => {
        el.style.display = "none";
      });

      // ── 6. 替换 canvas（CosmicBackground）为静态星空背景 ─────────────
      // 用 absolute 定位铺满整个 clone 容器，不用 fixed（fixed 只覆盖视口）
      clonedDoc.querySelectorAll<HTMLCanvasElement>("canvas").forEach((cv) => {
        const totalHeight = clonedContainer.scrollHeight || 8000;
        const wrapper = clonedDoc.createElement("div");
        wrapper.style.position = "absolute";
        wrapper.style.top = "0";
        wrapper.style.left = "0";
        wrapper.style.width = `${totalWidth}px`;
        wrapper.style.height = `${totalHeight}px`;
        wrapper.style.zIndex = "0";
        wrapper.style.pointerEvents = "none";
        // 深色星云渐变（平铺整张长图）
        wrapper.style.background = [
          `radial-gradient(ellipse ${totalWidth * 0.6}px ${totalHeight * 0.3}px at ${totalWidth * 0.22}px ${totalHeight * 0.08}px, rgba(70,95,210,0.12) 0%, transparent 100%)`,
          `radial-gradient(ellipse ${totalWidth * 0.5}px ${totalHeight * 0.25}px at ${totalWidth * 0.80}px ${totalHeight * 0.35}px, rgba(120,70,185,0.10) 0%, transparent 100%)`,
          `radial-gradient(ellipse ${totalWidth * 0.45}px ${totalHeight * 0.22}px at ${totalWidth * 0.55}px ${totalHeight * 0.65}px, rgba(40,130,195,0.08) 0%, transparent 100%)`,
          `radial-gradient(ellipse ${totalWidth * 0.4}px ${totalHeight * 0.20}px at ${totalWidth * 0.85}px ${totalHeight * 0.88}px, rgba(50,100,200,0.07) 0%, transparent 100%)`,
          "linear-gradient(180deg, #0a1024 0%, #080d1a 40%, #060a18 100%)",
        ].join(",");
        // 用 box-shadow 模拟星星，覆盖整张长图
        const rng = (seed: number) => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
        const shadows: string[] = [];
        for (let i = 0; i < 300; i++) {
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
        wrapper.appendChild(starEl);
        cv.replaceWith(wrapper);
      });
    },
  });

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
