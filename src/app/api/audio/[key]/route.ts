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
  get(key: string, options?: { range?: { offset: number; length: number } }): Promise<R2Object | null>;
}
interface R2Object {
  httpMetadata?: { contentType?: string };
  body: ReadableStream<Uint8Array>;
  size: number;
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

  // 先找到文件存在的路径
  const possiblePaths = [
    key,
    !key.startsWith("audio/") ? `audio/${key}` : null,
    `permanent/${key}`,
    !key.startsWith("audio/") ? `permanent/audio/${key}` : null,
  ].filter((p): p is string => p !== null);

  let foundPath: string | null = null;
  for (const path of possiblePaths) {
    const obj = await bucket.get(path);
    if (obj) {
      foundPath = path;
      break;
    }
  }

  if (!foundPath) {
    return NextResponse.json({ error: "音频不存在或已过期" }, { status: 404 });
  }

  // 解析 Range 请求
  const rangeHeader = req.headers.get("range");
  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      // 先获取完整对象以获取总大小
      const fullObject = await bucket.get(foundPath);
      if (!fullObject) {
        return NextResponse.json({ error: "音频不存在或已过期" }, { status: 404 });
      }
      const totalSize = fullObject.size;
      const start = parseInt(match[1]);
      const end = match[2] ? parseInt(match[2]) : totalSize - 1;
      const length = end - start + 1;

      // 重新获取指定范围
      const rangedObject = await bucket.get(foundPath, { range: { offset: start, length } });
      if (!rangedObject) {
        return NextResponse.json({ error: "音频不存在或已过期" }, { status: 404 });
      }

      return new NextResponse(rangedObject.body, {
        status: 206,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(length),
          "Cache-Control": "public, max-age=1209600",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  }

  // 无 Range 请求，返回完整文件流
  const object = await bucket.get(foundPath);
  if (!object) {
    return NextResponse.json({ error: "音频不存在或已过期" }, { status: 404 });
  }

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
      "Content-Length": String(object.size),
      "Cache-Control": "public, max-age=1209600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
