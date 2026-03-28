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
    // 去掉 scroll/wheel，避免移动端滑动时提前触发音频解锁（解锁后 Scene4_5Candle 可能误播）
    const events = ["click", "touchend", "pointerdown", "keydown"] as const;
    const once = { once: true };
    events.forEach((e) => document.addEventListener(e, handler, once));
    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
    };
  }, [handler]);

  return { cancel };
}
