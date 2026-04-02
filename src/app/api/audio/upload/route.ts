/**
 * POST /api/audio/upload
 * 接收前端音频 dataUrl，上传到 R2，返回 { key }
 *
 * 安全说明：
 * - R2 bucket 通过 Workers binding 访问，不暴露任何账号/密钥信息
 * - 通过 Origin 校验限制请求来源，防止外部滥用
 * - 仅接受 audio/mpeg 格式，大小限制 5MB
 */

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface R2Bucket {
  put(key: string, value: Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<void>;
}

function getR2Bucket(): R2Bucket | undefined {
  try {
    const ctx = getCloudflareContext();
    return (ctx.env as Record<string, unknown>).R2_BUCKET as R2Bucket | undefined;
  } catch {
    return undefined;
  }
}

const ALLOWED_ORIGINS = new Set([
  "https://thesedays.cn",
  "https://www.thesedays.cn",
  "https://happy-birthday.65751062.workers.dev",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:8080",
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin);
}

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: "不允许的来源" }, { status: 403 });
  }

  try {
    const { dataUrl } = await req.json() as { dataUrl?: string };

    if (!dataUrl || typeof dataUrl !== "string") {
      return NextResponse.json({ error: "缺少音频数据" }, { status: 400 });
    }

    if (!dataUrl.startsWith("data:audio/mpeg")) {
      return NextResponse.json({ error: "仅支持 mp3 格式" }, { status: 400 });
    }

    // 大小校验（base64 长度 × 0.75 ≈ 字节数）
    const approxBytes = (dataUrl.length * 3) / 4;
    if (approxBytes > MAX_BYTES) {
      return NextResponse.json({ error: "音频超过 5MB 限制" }, { status: 413 });
    }

    const [, base64] = dataUrl.split(",");
    if (!base64) {
      return NextResponse.json({ error: "音频数据格式错误" }, { status: 400 });
    }

    const uuid = crypto.randomUUID();
    const key = `audio/${uuid}`;

    const bucket = getR2Bucket();
    if (!bucket) {
      return NextResponse.json({ key: `local-${uuid}` });
    }

    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    await bucket.put(key, bytes, {
      httpMetadata: { contentType: "audio/mpeg" },
    });

    return NextResponse.json({ key });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
