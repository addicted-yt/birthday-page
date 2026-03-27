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
    const events = ["click", "touchstart", "keydown", "wheel"] as const;
    const once = { once: true };
    events.forEach((e) => document.addEventListener(e, handler, once));
    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
    };
  }, [handler]);

  return { cancel };
}
