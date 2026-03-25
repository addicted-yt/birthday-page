import LZString from "lz-string";
import { BirthdayData } from "@/types/birthday";

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
    cardCaptions: data.cardPhotos.map((p) => p.caption || ""),
    giftImageCount: data.giftImages.length,
    cardPhotoCount: data.cardPhotos.length,
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
  if (!d) return null;

  try {
    const textData = JSON.parse(
      LZString.decompressFromEncodedURIComponent(d) || "{}"
    );

    if (sid && typeof window !== "undefined") {
      const stored = sessionStorage.getItem(sid);
      if (stored) {
        return JSON.parse(stored) as BirthdayData;
      }
    }

    return {
      v: 1,
      name: textData.name || "",
      giftLetter: textData.giftLetter || "",
      letterAlign: textData.letterAlign,
      placeholderPhrases: textData.placeholderPhrases,
      placeholderStyles: textData.placeholderStyles,
      cardPhotos: Array.from(
        { length: textData.cardPhotoCount || 0 },
        (_: unknown, i: number) => ({
          dataUrl: "",
          caption: textData.cardCaptions?.[i] || "",
        })
      ),
      giftImages: Array.from(
        { length: textData.giftImageCount || 0 },
        () => ({ dataUrl: "" })
      ),
    };
  } catch {
    return null;
  }
}
