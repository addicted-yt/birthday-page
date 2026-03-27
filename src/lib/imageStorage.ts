/**
 * imageStorage.ts
 * - IndexedDB：本地永久缓存图片（创建者自己设备可永久访问）
 * - R2 API：上传图片到服务端，获得 key 用于分享链接
 *
 * 安全说明：
 * - 所有 R2 操作经 /api/images/* 服务端代理，前端不接触任何 bucket/账号信息
 * - IndexedDB 存储在浏览器本地，不发送到任何服务器
 */

const DB_NAME = "birthday-images";
const DB_VERSION = 1;
const STORE_NAME = "images";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** 从 IndexedDB 读取图片 dataUrl，key 不存在时返回 null */
export async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/** 将图片 dataUrl 存入 IndexedDB */
export async function idbPut(key: string, dataUrl: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).put(dataUrl, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // IndexedDB 失败不影响主流程
  }
}

/** 从 IndexedDB 删除指定 key */
export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

/**
 * 上传单张图片到 R2（通过服务端代理）
 * 返回 R2 key（UUID）
 * 5MB 大小限制由服务端校验，这里做前端预检
 */
export async function uploadImageToR2(dataUrl: string): Promise<string> {
  // 前端预检：base64 字符数 × 0.75 ≈ 字节数
  const byteSize = (dataUrl.length * 3) / 4;
  if (byteSize > 5 * 1024 * 1024) {
    throw new Error("图片超过 5MB 限制，请压缩后重试");
  }

  const res = await fetch("/api/images/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "上传失败");
  }

  const { key } = await res.json() as { key: string };
  return key;
}

/**
 * 从 R2 获取图片 dataUrl（通过服务端代理）
 * 先查 IndexedDB 缓存，命中则直接返回，避免重复请求
 */
export async function fetchImageFromR2(key: string): Promise<string | null> {
  // 先查本地缓存
  const cached = await idbGet(key);
  if (cached) return cached;

  try {
    const res = await fetch(`/api/images/${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // 写入本地缓存，下次不用再请求
        idbPut(key, dataUrl);
        resolve(dataUrl);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
