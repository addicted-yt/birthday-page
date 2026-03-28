"use client";
import { useEffect, useCallback, useRef } from "react";

export function useFirstInteraction(callback: () => void) {
  const cancelledRef = useRef(false);

  const handler = useCallback(() => {
    if (!cancelledRef.current) callback();
  }, [callback]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  useEffect(() => {
    // touchend 比 touchstart 更被微信/iOS WKWebView 接受，可在 touchend 回调里调用 audio.play()
    // 桌面端额外监听 wheel，确保用户滚动到蛋糕幕时已解锁音频（移动端不加 wheel，避免提前触发）
    const isTouchDevice =
      typeof window !== "undefined" &&
      ("ontouchstart" in window ||
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(hover: none) and (pointer: coarse)").matches));
    const events = isTouchDevice
      ? (["click", "touchend", "pointerdown", "keydown"] as const)
      : (["click", "pointerdown", "keydown", "wheel"] as const);
    const once = { once: true };
    events.forEach((e) => document.addEventListener(e, handler, once as AddEventListenerOptions));
    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
    };
  }, [handler]);

  return { cancel };
}
