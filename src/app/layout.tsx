import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://thesedays.cn"),
  title: "星愿 — 送给TA的一份特别祝福",
  description: "写一段话 · 选几张照片 · 配一首歌 · 剩下的交给星光",
  applicationName: "星愿",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "星愿",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <head>
        {/* 预加载结尾幕蛋糕 emoji，避免 demo/预览页首次加载慢 */}
        <link rel="preload" href="/emoji/birthday.png" as="image" />
        <link rel="preload" href="/emoji/gift.png" as="image" />
        <link rel="preload" href="/emoji/balloon.png" as="image" />
        <link rel="preload" href="/emoji/confetti_ball.png" as="image" />
        <link rel="preload" href="/emoji/tada.png" as="image" />
      </head>
      <body className="min-h-full bg-[#080d1a] text-[#e8e8f0]">
        {children}
      </body>
    </html>
  );
}
