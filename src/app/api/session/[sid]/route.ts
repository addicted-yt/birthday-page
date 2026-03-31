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

interface PermanentStore {
  version: number;
  records: Record<string, { savedAt: string; savedBy: string }>;
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

  // 顺带查询永久保存状态
  let isPermanent = false;
  try {
    const permanentObj = await bucket.get("_sys/permanent.json");
    if (permanentObj) {
      const store = JSON.parse(await permanentObj.text()) as PermanentStore;
      isPermanent = sid in store.records;
    }
  } catch {
    // 查询失败不影响主流程，isPermanent 保持 false
  }

  // 如果是永久保存，优先从 permanent/ 前缀读取（防止原始文件被 lifecycle 删除）
  let object = await bucket.get(isPermanent ? `permanent/session/${sid}.json` : `session/${sid}.json`);
  // 降级：permanent/ 副本还未生成时，回退到原始路径
  if (!object) object = await bucket.get(`session/${sid}.json`);
  if (!object) {
    return NextResponse.json({ error: "数据不存在或已过期" }, { status: 404 });
  }

  // 将 isPermanent 注入到返回的 JSON 中
  let responseData: Record<string, unknown>;
  try {
    const text = await object.text();
    responseData = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "数据格式错误" }, { status: 500 });
  }
  responseData.isPermanent = isPermanent;

  return new NextResponse(JSON.stringify(responseData), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600", // 1小时缓存，数据不变
    },
  });
}
