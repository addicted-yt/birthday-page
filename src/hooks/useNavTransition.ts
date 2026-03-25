"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * 带黑幕淡出的页面导航 hook。
 * 调用 navigate(href) 后先显示淡入遮罩，再跳转。
 */
export function useNavTransition() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const navigate = useCallback((href: string) => {
    setLeaving(true);
    setTimeout(() => router.push(href), 380);
  }, [router]);

  return { leaving, navigate };
}
