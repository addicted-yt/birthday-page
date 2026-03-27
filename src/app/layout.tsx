import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://thesedays.cn"),
  title: "送给TA的一份特别祝福",
  description: "可定制 · 可分享 · 沉浸式体验",
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
      </head>
      <body className="min-h-full bg-[#080d1a] text-[#e8e8f0]">
        {children}
      </body>
    </html>
  );
}
