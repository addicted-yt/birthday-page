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

// 给所有 img 元素加 crossOrigin，避免 R2 图片污染 canvas
function patchCrossOrigin(container: HTMLElement): () => void {
  const patched: Array<{ el: HTMLImageElement; prev: string | null }> = [];
  container.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
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

export interface SnapshotResult {
  dataUrl: string;
}

export async function takeSnapshot(container: HTMLElement): Promise<SnapshotResult> {
  // 1. 先设置 crossOrigin，等图片重新加载
  const restoreCrossOrigin = patchCrossOrigin(container);
  await new Promise((r) => setTimeout(r, 500));

  // 2. 用 onclone 在克隆副本里展开容器 + 替换 backdrop-filter
  //    这样真实 DOM 完全不受影响，不会触发页面跳转或闪烁
  const canvas = await html2canvas(container, {
    useCORS: true,
    allowTaint: false,
    scale: 1,
    backgroundColor: "#080d1a",
    logging: false,
    // 不传 height/windowHeight，让 html2canvas 自己从 clone 后的 DOM 计算
    onclone: (_clonedDoc, clonedContainer) => {
      // 展开 scroll-snap 容器
      clonedContainer.style.height = "auto";
      clonedContainer.style.overflowY = "visible";
      clonedContainer.style.scrollSnapType = "none";
      clonedContainer.style.position = "relative";

      // 替换所有 backdrop-filter 元素的背景色（html2canvas 不支持 backdrop-filter）
      clonedContainer.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const style = window.getComputedStyle(
          // getComputedStyle 需要用原始 DOM 元素，cloned 的样式通过 el.style 内联覆盖
          el
        );
        const bf =
          style.backdropFilter ||
          (style as unknown as Record<string, string>)["webkitBackdropFilter"] ||
          "";
        if (bf && bf !== "none") {
          el.style.background = "#0d1020";
          el.style.backdropFilter = "none";
          (el.style as unknown as Record<string, string>)["webkitBackdropFilter"] = "none";
        }
      });

      // 隐藏所有 fixed 定位的 UI 元素（按钮、弹窗等不属于幕内容的覆盖层）
      clonedContainer.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const pos = window.getComputedStyle(el).position;
        if (pos === "fixed") {
          el.style.display = "none";
        }
      });
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
