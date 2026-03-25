import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // 静态导出时图片优化需要禁用（Cloudflare Pages 不支持 Next.js Image Optimization Server）
  images: {
    unoptimized: true,
  },
  // 生成 trailing slash，Cloudflare Pages 路由更稳定
  trailingSlash: true,
};

export default nextConfig;
