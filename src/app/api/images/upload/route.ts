/**
 * POST /api/images/upload
 * 接收前端图片 dataUrl，上传到 R2，返回 { key }
 *
 * 安全说明：
 * - R2 bucket 通过 Workers binding 访问，binding 名由 Cloudflare 后台注入
 * - 本文件不含任何账号 ID、密钥、bucket 名称等私密信息
 * - 前端只能看到返回的 key（UUID），无法推导出 R2 任何信息
 * - 通过 Origin 校验限制请求来源，防止外部滥用
 */

import { NextRequest, NextResponse } from "next/server";

// R2Bucket 最小类型声明（仅此文件使用，不引入全局 Workers 类型避免与 DOM 冲突）
interface R2Bucket {
  put(key: string, value: Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<void>;
}

// 获取 R2 binding（Workers 环境）或 undefined（Vercel/本地环境）
function getR2Bucket(): R2Bucket | undefined {
  // @ts-expect-error Workers binding，非标准 Node.js 全局
  return typeof globalThis.R2_BUCKET !== "undefined" ? globalThis.R2_BUCKET as R2Bucket : undefined;
}

// 允许的来源域名列表（新增域名在此追加即可）
const ALLOWED_ORIGINS = new Set([
  "https://happybirthday-alpha-gules.vercel.app",
  "https://happy-birthday.65751062.workers.dev",
  "http://localhost:3000",
  "http://localhost:3001",
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin);
}

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Origin 校验：拒绝来源不在白名单的请求
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: "不允许的来源" }, { status: 403 });
  }

  try {
    const { dataUrl } = await req.json() as { dataUrl?: string };

    if (!dataUrl || typeof dataUrl !== "string") {
      return NextResponse.json({ error: "缺少图片数据" }, { status: 400 });
    }

    // 校验格式
    if (!dataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "不支持的图片格式" }, { status: 400 });
    }

    // 大小校验（base64 长度 × 0.75 ≈ 字节数）
    const approxBytes = (dataUrl.length * 3) / 4;
    if (approxBytes > MAX_BYTES) {
      return NextResponse.json({ error: "图片超过 5MB 限制" }, { status: 413 });
    }

    // 解析 base64
    const [header, base64] = dataUrl.split(",");
    const mimeMatch = header.match(/data:(image\/\w+);base64/);
    if (!mimeMatch || !base64) {
      return NextResponse.json({ error: "图片数据格式错误" }, { status: 400 });
    }
    const contentType = mimeMatch[1];

    // 生成随机 key（UUID v4 格式）
    const key = crypto.randomUUID();

    const bucket = getR2Bucket();

    if (!bucket) {
      // 非 Workers 环境（Vercel 本地开发）：返回模拟 key，提示功能仅在 Workers 上可用
      // 开发时 dataUrl 留在 sessionStorage，不影响本地测试
      return NextResponse.json({ key: `local-${key}` });
    }

    // 转换 base64 → Uint8Array
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    await bucket.put(key, bytes, {
      httpMetadata: { contentType },
    });

    return NextResponse.json({ key });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
