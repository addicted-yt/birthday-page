/**
 * POST /api/permanent/save
 * 管理员专用：将指定 sessionId 标记为永久保存
 *
 * 安全说明：
 * - 密码通过环境变量 PERMANENT_ADMIN_PASSWORD 注入，代码中不硬编码
 * - 本地开发：密码存在 .dev.vars（已在 .gitignore 中）
 * - 线上：通过 wrangler secret put PERMANENT_ADMIN_PASSWORD 设置
 */

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: string | ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<void>;
}
interface R2Object {
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  httpMetadata?: { contentType?: string };
}

interface PermanentRecord {
  savedAt: string;
  savedBy: string;
}
interface PermanentStore {
  version: number;
  records: Record<string, PermanentRecord>;
}

function getR2Bucket(): R2Bucket | undefined {
  try {
    const ctx = getCloudflareContext();
    return (ctx.env as Record<string, unknown>).R2_BUCKET as R2Bucket | undefined;
  } catch {
    return undefined;
  }
}

function getAdminPassword(): string | undefined {
  try {
    const ctx = getCloudflareContext();
    return (ctx.env as Record<string, unknown>).PERMANENT_ADMIN_PASSWORD as string | undefined;
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { sessionId?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const { sessionId, password } = body;

  // 校验 sessionId 格式（与 /api/session/[sid] 保持一致）
  if (typeof sessionId !== "string" || !/^[a-z0-9]{8,32}$/.test(sessionId)) {
    return NextResponse.json({ error: "无效的 sessionId" }, { status: 400 });
  }

  // 验证密码
  const adminPassword = getAdminPassword();
  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({
      error: "密码错误",
      debug: { envFound: !!adminPassword, envLen: adminPassword?.length ?? 0, inputLen: typeof password === "string" ? password.length : -1 },
    }, { status: 403 });
  }

  const bucket = getR2Bucket();
  if (!bucket) {
    return NextResponse.json({ error: "服务暂不可用（仅 Workers 环境支持）" }, { status: 503 });
  }

  // 读取现有 permanent.json（不存在则初始化）
  let store: PermanentStore = { version: 1, records: {} };
  const existing = await bucket.get("_sys/permanent.json");
  if (existing) {
    try {
      store = JSON.parse(await existing.text()) as PermanentStore;
    } catch {
      // 文件损坏，重置
      store = { version: 1, records: {} };
    }
  }

  // 写入记录
  store.records[sessionId] = {
    savedAt: new Date().toISOString(),
    savedBy: "admin",
  };

  await bucket.put("_sys/permanent.json", JSON.stringify(store), {
    httpMetadata: { contentType: "application/json" },
  });

  // 复制 session json 和图片到 permanent/ 前缀，防止 lifecycle 规则删除
  try {
    const sessionObj = await bucket.get(`session/${sessionId}.json`);
    if (sessionObj) {
      const sessionText = await sessionObj.text();
      // 复制 session json
      await bucket.put(`permanent/session/${sessionId}.json`, sessionText, {
        httpMetadata: { contentType: "application/json" },
      });

      // 解析出所有 imageKey，逐个复制图片
      const sessionData = JSON.parse(sessionText) as Record<string, unknown>;
      const imageKeys: string[] = [];
      // cardPhotos[].imageKey
      const cardPhotos = sessionData.cardPhotos as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(cardPhotos)) {
        for (const p of cardPhotos) {
          if (typeof p.imageKey === "string" && p.imageKey) imageKeys.push(p.imageKey);
        }
      }
      // giftImages[].imageKey
      const giftImages = sessionData.giftImages as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(giftImages)) {
        for (const g of giftImages) {
          if (typeof g.imageKey === "string" && g.imageKey) imageKeys.push(g.imageKey);
        }
      }

      // 复制图片：兼容新前缀 images/{uuid} 和旧裸 UUID
      await Promise.all(imageKeys.map(async (imageKey) => {
        // 提取 uuid 部分（兼容有无前缀）
        const uuid = imageKey.startsWith("images/") ? imageKey.slice(7) : imageKey;
        // 先尝试新前缀，再尝试旧裸 UUID
        let imgObj = await bucket.get(`images/${uuid}`);
        if (!imgObj) imgObj = await bucket.get(uuid);
        if (!imgObj) return;
        const imgBuf = await imgObj.arrayBuffer();
        const contentType = imgObj.httpMetadata?.contentType ?? "image/jpeg";
        await bucket.put(`permanent/images/${uuid}`, imgBuf, {
          httpMetadata: { contentType },
        });
      }));
    }
  } catch {
    // 复制失败不影响标记本身，_sys/permanent.json 已写入
  }

  return NextResponse.json({ success: true });
}
