/**
 * POST /api/session/save
 * 接收完整 BirthdayData JSON，存到 R2，返回短 sid
 *
 * 安全说明：
 * - R2 bucket 通过 Workers binding 访问，不暴露任何账号/密钥信息
 * - sid 是随机字符串，无法反推任何信息
 * - 通过 Origin 校验限制请求来源
 */

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface R2Bucket {
  put(key: string, value: string, options?: { httpMetadata?: { contentType?: string } }): Promise<void>;
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
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin);
}

function generateSid(): string {
  // 生成 16 位随机字符串（字母+数字），足够随机且不可枚举
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let sid = "";
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  for (const byte of array) {
    sid += chars[byte % chars.length];
  }
  return sid;
}

const MAX_JSON_BYTES = 500 * 1024; // 500KB，文字数据不可能超过这个

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: "不允许的来源" }, { status: 403 });
  }

  try {
    const body = await req.text();
    if (!body || body.length > MAX_JSON_BYTES) {
      return NextResponse.json({ error: "数据格式错误或超出限制" }, { status: 400 });
    }

    // 校验是合法 JSON
    JSON.parse(body);

    const sid = generateSid();
    const bucket = getR2Bucket();

    if (!bucket) {
      // 非 Workers 环境：返回模拟 sid
      return NextResponse.json({ sid: `local-${sid}` });
    }

    await bucket.put(`session/${sid}.json`, body, {
      httpMetadata: { contentType: "application/json" },
    });

    return NextResponse.json({ sid });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
