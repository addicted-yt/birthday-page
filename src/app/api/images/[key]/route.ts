/**
 * GET /api/images/[key]
 * 从 R2 读取图片并返回给前端
 *
 * 安全说明：
 * - R2 bucket 通过 Workers binding 访问，不暴露任何账号/密钥信息
 * - key 只是 UUID，无法反推 bucket 名或账号信息
 * - R2 bucket 为私有，必须经过此代理才能访问
 */

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// R2Bucket 最小类型声明（仅此文件使用）
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
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
): Promise<NextResponse> {
  const { key } = await params;

  // 安全校验：key 只允许 UUID 格式（字母数字和连字符），防止路径注入
  if (!/^[\w-]{1,100}$/.test(key)) {
    return NextResponse.json({ error: "无效的 key" }, { status: 400 });
  }

  const bucket = getR2Bucket();
  if (!bucket) {
    return NextResponse.json({ error: "图片服务暂不可用（仅 Workers 环境支持）" }, { status: 503 });
  }

  const object = await bucket.get(key);
  if (!object) {
    return NextResponse.json({ error: "图片不存在或已过期" }, { status: 404 });
  }

  const contentType = object.httpMetadata?.contentType ?? "image/jpeg";
  const arrayBuffer = await object.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=1209600", // 14天缓存
      "Access-Control-Allow-Origin": "*", // 允许 html2canvas 截图时跨域读取图片
    },
  });
}
