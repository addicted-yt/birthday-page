import Image from "next/image";

type EmojiName = "birthday" | "balloon" | "confetti" | "gift" | "tada";

const EMOJI_MAP: Record<EmojiName, string> = {
  birthday: "/emoji/birthday.png",
  balloon: "/emoji/balloon.png",
  confetti: "/emoji/confetti_ball.png",
  gift: "/emoji/gift.png",
  tada: "/emoji/tada.png",
};

interface EmojiImageProps {
  emoji: EmojiName;
  size?: number;
  className?: string;
  alt?: string;
}

export function EmojiImage({
  emoji,
  size = 48,
  className = "",
  alt = "",
}: EmojiImageProps) {
  return (
    <Image
      src={EMOJI_MAP[emoji]}
      alt={alt}
      width={size}
      height={size}
      className={className}
      draggable={false}
    />
  );
}
