// 默认卡片占位图（SVG dataUrl）+ 可选英文短句
// 风格：深色宇宙 + 生日元素（线条符号），4:5 比例

export const BIRTHDAY_PHRASES = [
  "born to shine",
  "today is yours",
  "wish upon a star",
  "you are the light",
  "make a wish",
  "one more trip around the sun",
] as const;

export type BirthdayPhrase = typeof BIRTHDAY_PHRASES[number];

function makeSvg(bg: string, symbol: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
  <defs>
    ${bg}
    <filter id="sf"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>
  <!-- 背景 -->
  <rect width="400" height="500" fill="url(#svgbg)"/>
  <!-- 星点 -->
  <circle cx="42" cy="38" r="0.6" fill="white" opacity="0.55"/>
  <circle cx="118" cy="22" r="0.5" fill="white" opacity="0.45"/>
  <circle cx="198" cy="45" r="0.6" fill="white" opacity="0.6"/>
  <circle cx="278" cy="18" r="0.4" fill="white" opacity="0.4"/>
  <circle cx="352" cy="55" r="0.6" fill="white" opacity="0.55"/>
  <circle cx="68" cy="88" r="0.5" fill="white" opacity="0.45"/>
  <circle cx="162" cy="72" r="0.4" fill="white" opacity="0.5"/>
  <circle cx="310" cy="92" r="0.5" fill="white" opacity="0.45"/>
  <circle cx="380" cy="30" r="0.4" fill="white" opacity="0.4"/>
  <circle cx="22" cy="140" r="0.5" fill="white" opacity="0.4"/>
  <circle cx="388" cy="155" r="0.5" fill="white" opacity="0.4"/>
  <circle cx="30" cy="380" r="0.5" fill="white" opacity="0.4"/>
  <circle cx="375" cy="362" r="0.5" fill="white" opacity="0.45"/>
  <circle cx="55" cy="450" r="0.6" fill="white" opacity="0.5"/>
  <circle cx="148" cy="468" r="0.4" fill="white" opacity="0.4"/>
  <circle cx="252" cy="455" r="0.5" fill="white" opacity="0.45"/>
  <circle cx="348" cy="472" r="0.4" fill="white" opacity="0.4"/>
  <!-- 亮星 -->
  <circle cx="88" cy="162" r="1.3" fill="white" opacity="0.85"/>
  <circle cx="88" cy="162" r="3" fill="white" opacity="0.1"/>
  <circle cx="318" cy="235" r="1.5" fill="white" opacity="0.9"/>
  <circle cx="318" cy="235" r="3.5" fill="white" opacity="0.08"/>
  <!-- 生日符号 -->
  ${symbol}
</svg>`;
}

// 卡片1：蜡烛（三根细线烛焰 + 烛体）
const candle = `
  <g transform="translate(200,210)" opacity="0.28">
    <!-- 左蜡烛 -->
    <rect x="-36" y="20" width="8" height="38" rx="2" fill="none" stroke="white" stroke-width="0.9"/>
    <ellipse cx="-32" cy="14" rx="5" ry="8" fill="none" stroke="white" stroke-width="0.8"/>
    <line x1="-32" y1="6" x2="-32" y2="-2" stroke="white" stroke-width="0.7" opacity="0.6"/>
    <!-- 中蜡烛（最高）-->
    <rect x="-5" y="0" width="10" height="50" rx="2" fill="none" stroke="white" stroke-width="0.9"/>
    <ellipse cx="0" cy="-7" rx="6" ry="9" fill="none" stroke="white" stroke-width="0.8"/>
    <line x1="0" y1="-16" x2="0" y2="-26" stroke="white" stroke-width="0.7" opacity="0.6"/>
    <!-- 右蜡烛 -->
    <rect x="28" y="20" width="8" height="38" rx="2" fill="none" stroke="white" stroke-width="0.9"/>
    <ellipse cx="32" cy="14" rx="5" ry="8" fill="none" stroke="white" stroke-width="0.8"/>
    <line x1="32" y1="6" x2="32" y2="-2" stroke="white" stroke-width="0.7" opacity="0.6"/>
    <!-- 底座装饰线 -->
    <line x1="-46" y1="60" x2="46" y2="60" stroke="white" stroke-width="0.5" opacity="0.5"/>
  </g>`;

// 卡片2：皇冠
const crown = `
  <g transform="translate(200,230)" opacity="0.28">
    <polyline points="-48,40 -48,-10 -24,-32 0,0 24,-32 48,-10 48,40" fill="none" stroke="white" stroke-width="1" stroke-linejoin="round"/>
    <line x1="-48" y1="40" x2="48" y2="40" stroke="white" stroke-width="0.8"/>
    <circle cx="-48" cy="-10" r="3" fill="none" stroke="white" stroke-width="0.8"/>
    <circle cx="0" cy="0" r="3" fill="none" stroke="white" stroke-width="0.8"/>
    <circle cx="48" cy="-10" r="3" fill="none" stroke="white" stroke-width="0.8"/>
    <!-- 顶部星形 -->
    <polygon points="0,-48 3,-38 13,-38 5,-32 8,-22 0,-28 -8,-22 -5,-32 -13,-38 -3,-38" fill="none" stroke="white" stroke-width="0.8" opacity="0.7"/>
  </g>`;

// 卡片3：月亮 + 星环
const moon = `
  <g transform="translate(200,215)" opacity="0.28">
    <!-- 月牙 -->
    <path d="M 20,-50 A 50,50 0 1 1 20,50 A 30,30 0 1 0 20,-50 Z" fill="none" stroke="white" stroke-width="1"/>
    <!-- 环绕小星 -->
    <circle cx="-48" cy="-18" r="1.5" fill="white" opacity="0.6"/>
    <circle cx="52" cy="8" r="1.2" fill="white" opacity="0.5"/>
    <circle cx="-28" cy="55" r="1.4" fill="white" opacity="0.55"/>
    <circle cx="10" cy="-58" r="1.2" fill="white" opacity="0.5"/>
    <circle cx="42" cy="-42" r="1.0" fill="white" opacity="0.4"/>
    <!-- 装饰弧线 -->
    <path d="M -55,0 A 58,58 0 0 1 55,0" fill="none" stroke="white" stroke-width="0.4" opacity="0.2" stroke-dasharray="3,5"/>
  </g>`;

const bg1 = `<radialGradient id="svgbg" cx="50%" cy="40%" r="70%">
  <stop offset="0%" stop-color="#0a1628"/>
  <stop offset="55%" stop-color="#050d1a"/>
  <stop offset="100%" stop-color="#020609"/>
</radialGradient>`;

const bg2 = `<radialGradient id="svgbg" cx="50%" cy="50%" r="70%">
  <stop offset="0%" stop-color="#0e0818"/>
  <stop offset="50%" stop-color="#080510"/>
  <stop offset="100%" stop-color="#03020a"/>
</radialGradient>`;

const bg3 = `<linearGradient id="svgbg" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stop-color="#060a14"/>
  <stop offset="50%" stop-color="#080c1a"/>
  <stop offset="100%" stop-color="#04060e"/>
</linearGradient>`;

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getDefaultCardPlaceholders(phrases?: string | string[]): { dataUrl: string; phrase: string }[] {
  const arr: string[] = Array.isArray(phrases)
    ? phrases
    : phrases ? [phrases] : [];
  const getPhrase = (i: number) =>
    arr.length === 0 ? "" : (arr[i] ?? arr[arr.length - 1] ?? "");
  return [
    { dataUrl: svgToDataUrl(makeSvg(bg1, candle)), phrase: getPhrase(0) },
    { dataUrl: svgToDataUrl(makeSvg(bg2, crown)), phrase: getPhrase(1) },
    { dataUrl: svgToDataUrl(makeSvg(bg3, moon)),  phrase: getPhrase(2) },
  ];
}

// 默认（向后兼容）
export const DEFAULT_CARD_PLACEHOLDERS = getDefaultCardPlaceholders().map((c) => c.dataUrl);
