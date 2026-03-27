export interface CardPhoto {
  dataUrl: string;
  imageKey?: string;        // R2 存储 key，分享时用
  caption?: string;
  captionPosition?: "top" | "center" | "bottom";
  captionAlign?: "left" | "center" | "right";
  captionSize?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  captionColor?: string;
  captionFont?: "georgia"; // 默认卡片用 Georgia serif italic
}

export interface GiftImage {
  dataUrl: string;
  imageKey?: string;        // R2 存储 key，分享时用
}

export interface PlaceholderCardStyle {
  captionPosition?: "top" | "center" | "bottom";
  captionAlign?: "left" | "center" | "right";
  captionSize?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  captionColor?: string;
}

export interface BirthdayData {
  name: string;
  cardPhotos: CardPhoto[];
  giftLetter: string;
  letterAlign?: "left" | "center" | "right";
  giftImages: GiftImage[];
  placeholderPhrases?: string[];
  placeholderStyles?: PlaceholderCardStyle[]; // 每张默认卡的样式
  placeholderPhrase?: string;      // 已废弃，保留向后兼容
  v: 1;
}

export type CreateStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface CreateFlowState {
  step: CreateStep;
  name: string;
  cardPhotos: CardPhoto[];
  giftLetter: string;
  letterAlign?: "left" | "center" | "right";
  giftImages: GiftImage[];
  placeholderPhrases?: string[];
  placeholderStyles?: PlaceholderCardStyle[];
  placeholderPhrase?: string;      // 已废弃，保留向后兼容
}

export type SceneId =
  | "intro"
  | "title"
  | "cards"
  | "gift"
  | "letter"
  | "uplift"
  | "ending";
