/**
 * GET /api/audio/[key]
 * 从 R2 读取音频并返回给前端
 *
 * 安全说明：
 * - R2 bucket 通过 Workers binding 访问，不暴露任何账号/密钥信息
 * - key 只是 UUID，无法反推 bucket 名或账号信息
 * - R2 bucket 为私有，必须经过此代理才能访问
 */

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
}
interface R2Object {
  httpMetadata?: { contentType?: string };
  arrayBuffer(): Promise<ArrayBuffer>;
}

function getR2Bucket(): R2Bucket | undefined {
  try {
    const ctx = getCloudflareContext();
    return (ctx.env as Record<string, unknown>).R2_BUCKET as R2Bucket | undefined;
  } catch {
    return undefined;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
): Promise<NextResponse> {
  const { key } = await params;

  // 安全校验：只允许 UUID 格式或 audio/ 前缀的 UUID
  if (!/^(audio\/)?[\w-]{1,100}$/.test(key)) {
    return NextResponse.json({ error: "无效的 key" }, { status: 400 });
  }

  const bucket = getR2Bucket();
  if (!bucket) {
    return NextResponse.json({ error: "音频服务暂不可用（仅 Workers 环境支持）" }, { status: 503 });
  }

  // 先按 key 原样查找，再尝试加 audio/ 前缀，最后尝试 permanent/ 前缀（永久保存后的位置）
  let object = await bucket.get(key);
  if (!object && !key.startsWith("audio/")) {
    object = await bucket.get(`audio/${key}`);
  }
  if (!object) {
    object = await bucket.get(`permanent/${key}`);
  }
  if (!object && !key.startsWith("audio/")) {
    object = await bucket.get(`permanent/audio/${key}`);
  }
  if (!object) {
    return NextResponse.json({ error: "音频不存在或已过期" }, { status: 404 });
  }

  const arrayBuffer = await object.arrayBuffer();

  // 支持 Range 请求（音频 seek 需要）
  const rangeHeader = req.headers.get("range");
  if (rangeHeader) {
    const total = arrayBuffer.byteLength;
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1]);
      const end = match[2] ? parseInt(match[2]) : total - 1;
      const chunk = arrayBuffer.slice(start, end + 1);
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunk.byteLength),
          "Cache-Control": "public, max-age=1209600",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  }

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=1209600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
