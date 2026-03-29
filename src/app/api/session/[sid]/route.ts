/**
 * GET /api/session/[sid]
 * 从 R2 读取 BirthdayData JSON 并返回
 *
 * 安全说明：
 * - R2 bucket 通过 Workers binding 访问，不暴露任何账号/密钥信息
 * - sid 只允许小写字母和数字，防止路径注入
 */

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
}
interface R2Object {
  text(): Promise<string>;
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
  { params }: { params: Promise<{ sid: string }> }
): Promise<NextResponse> {
  const { sid } = await params;

  // 只允许小写字母和数字，防止路径注入
  if (!/^[a-z0-9]{8,32}$/.test(sid)) {
    return NextResponse.json({ error: "无效的 sid" }, { status: 400 });
  }

  const bucket = getR2Bucket();
  if (!bucket) {
    return NextResponse.json({ error: "服务暂不可用（仅 Workers 环境支持）" }, { status: 503 });
  }

  const object = await bucket.get(`session/${sid}.json`);
  if (!object) {
    return NextResponse.json({ error: "数据不存在或已过期" }, { status: 404 });
  }

  const text = await object.text();

  return new NextResponse(text, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600", // 1小时缓存，数据不变
    },
  });
}
