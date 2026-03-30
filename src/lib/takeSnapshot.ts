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

// 临时替换所有 backdrop-filter 元素的背景色，避免 html2canvas 截图时透明
function patchBackdropFilter(container: HTMLElement): () => void {
  const patched: Array<{ el: HTMLElement; prev: string }> = [];
  const els = container.querySelectorAll<HTMLElement>("*");
  els.forEach((el) => {
    const style = window.getComputedStyle(el);
    const bf = style.backdropFilter || (style as unknown as Record<string, string>)["webkitBackdropFilter"] || "";
    if (bf && bf !== "none") {
      patched.push({ el, prev: el.style.background });
      el.style.background = "#0d1020";
    }
  });
  return () => {
    patched.forEach(({ el, prev }) => { el.style.background = prev; });
  };
}

// 给所有 img 元素加 crossOrigin，避免 R2 图片污染 canvas
function patchCrossOrigin(container: HTMLElement): () => void {
  const patched: Array<{ el: HTMLImageElement; prev: string | null }> = [];
  container.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    if (!img.crossOrigin) {
      patched.push({ el: img, prev: img.getAttribute("crossorigin") });
      img.crossOrigin = "anonymous";
      // 强制重新加载图片以应用 crossOrigin
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

// 临时展开 scroll-snap 容器，让 html2canvas 能截到全部幕
function patchScrollContainer(container: HTMLElement): () => void {
  const prevHeight = container.style.height;
  const prevOverflowY = container.style.overflowY;
  const prevScrollSnapType = container.style.scrollSnapType;

  // 必须先解除 overflow 限制，再读 scrollHeight，否则 scrollHeight === clientHeight
  container.style.overflowY = "visible";
  container.style.height = "auto";
  container.style.scrollSnapType = "none";

  // 展开子幕：scroll-snap-start 的 height: 100dvh 是 CSS class 设置的，
  // inline style 覆盖优先级更高，不需要额外处理

  return () => {
    container.style.height = prevHeight;
    container.style.overflowY = prevOverflowY;
    container.style.scrollSnapType = prevScrollSnapType;
  };
}

export interface SnapshotResult {
  dataUrl: string;
}

export async function takeSnapshot(container: HTMLElement): Promise<SnapshotResult> {
  // crossOrigin 需先于展开容器设置，等图片重新加载
  const restoreCrossOrigin = patchCrossOrigin(container);
  await new Promise((r) => setTimeout(r, 400));

  // 展开 scroll-snap 容器，让所有幕都进入截图范围
  const restoreScroll = patchScrollContainer(container);
  // 等两帧确保 overflow:visible + height:auto 样式生效，scrollHeight 才准确
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const restoreBackdrop = patchBackdropFilter(container);

  // 展开后才读 scrollHeight，此时值才是全部幕的真实总高
  const totalHeight = container.scrollHeight;

  try {
    const canvas = await html2canvas(container, {
      useCORS: true,
      allowTaint: false,
      scale: 1, // 固定 dpr=1，避免移动端内存溢出
      backgroundColor: "#080d1a",
      logging: false,
      height: totalHeight,
      windowHeight: totalHeight,
      y: 0,
      x: 0,
    });

    const dataUrl = canvas.toDataURL("image/png");
    return { dataUrl };
  } finally {
    restoreBackdrop();
    restoreScroll();
    restoreCrossOrigin();
  }
}

// 桌面浏览器：直接触发下载
export function downloadSnapshot(dataUrl: string, filename = "birthday.png") {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
