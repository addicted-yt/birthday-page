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

function getAdminPasswordHash(): string | undefined {
  try {
    const ctx = getCloudflareContext();
    return (ctx.env as Record<string, unknown>).PERMANENT_ADMIN_PASSWORD_HASH as string | undefined;
  } catch {
    return undefined;
  }
}

// 简易频率限制：R2 存储最近失败时间戳，5 次/分钟失败后锁定 5 分钟
async function checkRateLimit(bucket: R2Bucket | undefined): Promise<boolean> {
  if (!bucket) return true; // 无 R2 环境时不限制
  const KEY = "_sys/ratelimit.json";
  const now = Date.now();
  const WINDOW_MS = 60_000;      // 1 分钟窗口
  const MAX_FAILS = 5;
  const LOCK_MS = 300_000;       // 超限后锁定 5 分钟

  let timestamps: number[] = [];
  try {
    const obj = await bucket.get(KEY);
    if (obj) timestamps = JSON.parse(await obj.text()) as number[];
  } catch { /* 文件不存在或损坏 */ }

  const recent = timestamps.filter(t => now - t < LOCK_MS);
  if (recent.length >= MAX_FAILS) return false; // 仍在锁定

  return true;
}

async function recordFailedAttempt(bucket: R2Bucket | undefined): Promise<void> {
  if (!bucket) return;
  const KEY = "_sys/ratelimit.json";
  const now = Date.now();
  const LOCK_MS = 300_000;
  let timestamps: number[] = [];
  try {
    const obj = await bucket.get(KEY);
    if (obj) timestamps = JSON.parse(await obj.text()) as number[];
  } catch { /* ignore */ }
  // 只保留锁定窗口内的时间戳，自动清理过期记录
  timestamps = timestamps.filter(t => now - t < LOCK_MS);
  timestamps.push(now);
  await bucket.put(KEY, JSON.stringify(timestamps), {
    httpMetadata: { contentType: "application/json" },
  });
}

async function verifyPassword(input: string): Promise<boolean> {
  const storedHash = getAdminPasswordHash();
  if (!storedHash) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const inputHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return inputHash === storedHash;
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: "不允许的来源" }, { status: 403 });
  }
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

  // 先检查频率限制（密码校验前）
  const preBucket = getR2Bucket();
  const allowed = await checkRateLimit(preBucket);
  if (!allowed) {
    return NextResponse.json({ error: "尝试次数过多，请 5 分钟后重试" }, { status: 429 });
  }

  // 验证密码
  const passwordOk = typeof password === "string" && await verifyPassword(password);
  if (!passwordOk) {
    await recordFailedAttempt(preBucket);
    return NextResponse.json({ error: "密码错误" }, { status: 403 });
  }

  const bucket = preBucket;
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

      // 复制音频：customAudio[].audioKey 格式为 audio/{uuid}
      const customAudio = sessionData.customAudio as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(customAudio)) {
        await Promise.all(customAudio.map(async (a) => {
          if (typeof a.audioKey !== "string" || !a.audioKey) return;
          const audioObj = await bucket.get(a.audioKey);
          if (!audioObj) return;
          const audioBuf = await audioObj.arrayBuffer();
          await bucket.put(`permanent/${a.audioKey}`, audioBuf, {
            httpMetadata: { contentType: "audio/mpeg" },
          });
        }));
      }
    }
  } catch {
    // 复制失败不影响标记本身，_sys/permanent.json 已写入
  }

  return NextResponse.json({ success: true });
}
