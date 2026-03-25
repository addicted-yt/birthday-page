import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 注意：不设置 output: "export"，保留 SSR 以支持动态 OG 图（/result/opengraph-image）
  // Vercel 原生支持 SSR，无需静态导出
};

export default nextConfig;
