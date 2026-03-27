import LZString from "lz-string";
import { BirthdayData } from "@/types/birthday";

export function decodeBirthdayTextData(d: string | null): Partial<BirthdayData> | null {
  if (!d) return null;

  try {
    return JSON.parse(LZString.decompressFromEncodedURIComponent(d) || "{}");
  } catch {
    return null;
  }
}

export function encodeBirthdayData(data: BirthdayData): {
  d: string;
  sid: string;
  name: string;
} {
  const sid = `bd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (typeof window !== "undefined") {
    sessionStorage.setItem(sid, JSON.stringify(data));
  }

  const textData = {
    v: data.v,
    name: data.name,
    giftLetter: data.giftLetter,
    letterAlign: data.letterAlign,
    // 卡片文字 + 样式全量（不含图片 dataUrl，图片留在 sessionStorage）
    cardPhotos: data.cardPhotos.map((p) => ({
      caption: p.caption || "",
      captionPosition: p.captionPosition,
      captionAlign: p.captionAlign,
      captionSize: p.captionSize,
      captionColor: p.captionColor,
      captionFont: p.captionFont,
      imageKey: p.imageKey,   // R2 key，有则存入URL
    })),
    giftImages: data.giftImages.map((g) => ({ imageKey: g.imageKey })),
    placeholderPhrases: data.placeholderPhrases,
    placeholderStyles: data.placeholderStyles,
  };

  const d = LZString.compressToEncodedURIComponent(JSON.stringify(textData));
  return { d, sid, name: encodeURIComponent(data.name) };
}

export function decodeBirthdayData(
  d: string | null,
  sid: string | null
): BirthdayData | null {
  const textData = decodeBirthdayTextData(d);
  if (!textData) return null;

    // URL 中的 d 参数是文字内容的权威来源，始终优先使用
    // sid 仅用于从 sessionStorage 补充图片 dataUrl（dataUrl 太大无法放进 URL）
    const cardPhotos = Array.from(
      { length: (textData.cardPhotos || []).length },
      (_: unknown, i: number) => ({
        dataUrl: "",
        imageKey: textData.cardPhotos?.[i]?.imageKey,
        caption: textData.cardPhotos?.[i]?.caption || "",
        captionPosition: textData.cardPhotos?.[i]?.captionPosition,
        captionAlign: textData.cardPhotos?.[i]?.captionAlign,
        captionSize: textData.cardPhotos?.[i]?.captionSize,
        captionColor: textData.cardPhotos?.[i]?.captionColor,
        captionFont: textData.cardPhotos?.[i]?.captionFont,
      })
    );

    const giftImages = Array.from(
      { length: (textData.giftImages || []).length },
      (_: unknown, i: number) => ({
        dataUrl: "",
        imageKey: textData.giftImages?.[i]?.imageKey,
      })
    );

    // 用 sid 从 sessionStorage 补充 dataUrl（仅创作者本设备有效）
    if (sid && typeof window !== "undefined") {
      const stored = sessionStorage.getItem(sid);
      if (stored) {
        try {
          const local = JSON.parse(stored) as BirthdayData;
          // 只补充 dataUrl，不覆盖任何文字/样式字段
          local.cardPhotos?.forEach((lp, i) => {
            if (cardPhotos[i] && lp.dataUrl) {
              cardPhotos[i].dataUrl = lp.dataUrl;
            }
          });
          local.giftImages?.forEach((lg, i) => {
            if (giftImages[i] && lg.dataUrl) {
              giftImages[i].dataUrl = lg.dataUrl;
            }
          });
        } catch {
          // sessionStorage 数据损坏，忽略
        }
      }
    }

  return {
    v: 1,
    name: textData.name || "",
    giftLetter: textData.giftLetter || "",
    letterAlign: textData.letterAlign,
    placeholderPhrases: textData.placeholderPhrases,
    placeholderStyles: textData.placeholderStyles,
    cardPhotos,
    giftImages,
  };
}
