"use client";
import { useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { BirthdayData, CardPhoto } from "@/types/birthday";
import { decodeBirthdayData } from "@/lib/urlEncoding";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useFirstInteraction } from "@/hooks/useFirstInteraction";
import { springGentle } from "@/lib/animationPresets";
import { getDefaultCardPlaceholders } from "@/lib/defaultCardPlaceholders";
import { Scene1Intro } from "./Scene1Intro";
import { Scene2Title } from "./Scene2Title";
import { Scene3Cards } from "./Scene3Cards";
import { Scene4Gift } from "./Scene4Gift";
import { Scene4_5Candle } from "./Scene4_5Candle";
import { Scene5Letter } from "./Scene5Letter";
import { Scene5Photos } from "./Scene5Photos";
import { Scene6Uplift } from "./Scene6Uplift";
import { Scene7Ending } from "./Scene7Ending";
import { CreatorToolbar } from "./CreatorToolbar";
import { PageTransitionOverlay } from "@/components/ui/PageTransitionOverlay";

const CosmicBackground = dynamic(
  () => import("./CosmicBackground").then((m) => m.CosmicBackground),
  { ssr: false }
);

interface ResultPageShellProps {
  encodedData: string | null;
  sessionId: string | null;
  encodedName?: string | null;
  isCreator?: boolean;
  showHomeButton?: boolean;
  data?: BirthdayData;
  endingCTA?: (onNavigateAway: () => void) => ReactNode;
  onNavigateAway?: () => void;
}

export function ResultPageShell({
  encodedData,
  sessionId,
  encodedName,
  isCreator = false,
  showHomeButton = false,
  data: propData,
  endingCTA,
  onNavigateAway,
}: ResultPageShellProps) {
  const router = useRouter();
  const [data, setData] = useState<BirthdayData | null>(propData || null);
  const [navigatingAway, setNavigatingAway] = useState(false);
  const [candleBlown, setCandleBlown] = useState(false);
  const [giftOpened, setGiftOpened] = useState(false);
  const [endingVisible, setEndingVisible] = useState(false);
  const [musicOn, setMusicOn] = useState(false);

  // 生日快乐歌（蜡烛幕）
  const birthdaySong = useAudioPlayer("/audio/birthday-song.mp3");
  // 钢琴背景（礼物+信件+结尾）
  const pianoMusic = useAudioPlayer("/audio/gift-bgm.mp3");

  const birthdaySongStarted = useRef(false);
  const pianoStarted = useRef(false);

  const giftRef = useRef<HTMLDivElement>(null);
  const scene5Ref = useRef<HTMLDivElement>(null);
  const scene5PhotosRef = useRef<HTMLDivElement>(null);

  // 分享链接
  const shareUrl =
    typeof window !== "undefined" && encodedData
      ? `${window.location.origin}/result?d=${encodedData}&sid=${sessionId ?? ""}${encodedName ? `&name=${encodedName}` : ""}`
      : "";

  // 清理首次交互监听器（navigate away 时用）
  const { cancel: cancelFirstInteraction } = useFirstInteraction(useCallback(() => {
    // 无需补播逻辑：音乐由用户滚动手势触发，不受 autoplay 策略限制
  }, []));

  useEffect(() => {
    if (!propData && encodedData) {
      const decoded = decodeBirthdayData(encodedData, sessionId);
      setData(decoded);
    }
  }, [encodedData, sessionId, propData]);

  // 进入蜡烛幕：播放生日快乐歌
  const handleCandleEnter = useCallback(() => {
    if (birthdaySongStarted.current) return;
    birthdaySongStarted.current = true;
    birthdaySong.fadeIn(0.72);
    setMusicOn(true);
  }, [birthdaySong]);

  // 蜡烛吹灭：生日歌淡出 → 平滑切到礼物幕
  const handleCandleBlown = useCallback(() => {
    setCandleBlown(true);
    birthdaySong.fadeOut();
    // 滚动到礼物幕
    requestAnimationFrame(() => {
      giftRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [birthdaySong]);

  const handleGiftOpen = useCallback(() => {
    setGiftOpened(true);
    // 如果因为某种原因钢琴还没启动（跳过蜡烛幕），现在启动
    if (!pianoStarted.current) {
      pianoStarted.current = true;
      pianoMusic.fadeIn(0.65);
      setMusicOn(true);
    }
    requestAnimationFrame(() => {
      scene5Ref.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [pianoMusic]);

  const handleLetterDone = useCallback(() => {
    if (!scene5PhotosRef.current) return;
    setTimeout(() => {
      scene5PhotosRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  }, []);

  const handleEndingVisible = useCallback(() => {
    setEndingVisible(true);
  }, []);

  const handleNavigateAway = useCallback(() => {
    cancelFirstInteraction();
    // 只有音乐已启动才淡出，避免无声时也触发
    if (birthdaySongStarted.current && birthdaySong.isPlaying()) birthdaySong.fadeOut();
    if (pianoStarted.current && pianoMusic.isPlaying()) pianoMusic.fadeOut();
    onNavigateAway?.();
  }, [birthdaySong, pianoMusic, cancelFirstInteraction, onNavigateAway]);

  const handleGoHome = useCallback(() => {
    cancelFirstInteraction();
    if (birthdaySongStarted.current && birthdaySong.isPlaying()) birthdaySong.fadeOut();
    if (pianoStarted.current && pianoMusic.isPlaying()) pianoMusic.fadeOut();
    setNavigatingAway(true);
    setTimeout(() => router.push("/"), 380);
  }, [birthdaySong, pianoMusic, cancelFirstInteraction, router]);

  // 音乐开关（结尾控制的是当前正在播放的音轨）
  const handleMusicToggle = useCallback(() => {
    if (pianoStarted.current) {
      pianoMusic.toggle();
    } else if (birthdaySongStarted.current) {
      birthdaySong.toggle();
    }
    setMusicOn((v) => !v);
  }, [pianoMusic, birthdaySong]);

  if (!data) {
    return (
      <div className="h-dvh flex items-center justify-center" style={{ background: "#080d1a" }}>
        <p className="text-white/20 text-xs tracking-[0.4em]">loading</p>
      </div>
    );
  }

  const cardPhotos = (() => {
    if (data.cardPhotos.length > 0) return data.cardPhotos;
    const phrases: string[] = Array.isArray(data.placeholderPhrases)
      ? data.placeholderPhrases
      : data.placeholderPhrase
      ? [data.placeholderPhrase]
      : [];
    return getDefaultCardPlaceholders(phrases).map(({ dataUrl, phrase }, i) => {
      const style = data.placeholderStyles?.[i];
      return {
        dataUrl,
        caption: phrase || undefined,
        captionPosition: (style?.captionPosition ?? "bottom") as "top" | "center" | "bottom",
        captionAlign: (style?.captionAlign ?? "center") as "left" | "center" | "right",
        captionSize: (style?.captionSize ?? "sm") as CardPhoto["captionSize"],
        captionColor: style?.captionColor,
        captionFont: phrase ? ("georgia" as const) : undefined,
      };
    });
  })();

  return (
    <div className="scroll-snap-y relative" style={{ background: "#080d1a" }}>
      <CosmicBackground />
      <PageTransitionOverlay leaving={navigatingAway} entering />

      {/* 返回首页按钮 — Demo 页常驻左上角 */}
      {showHomeButton && (
        <motion.button
          className="fixed z-50 flex items-center gap-2"
          style={{
            top: "clamp(1rem, 3vw, 1.5rem)",
            left: "clamp(1rem, 3vw, 1.5rem)",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "2rem",
            padding: "clamp(0.4rem, 1.2vw, 0.6rem) clamp(0.8rem, 2vw, 1.2rem)",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springGentle, delay: 1.5, scale: { type: "spring", damping: 12, stiffness: 500 } }}
          whileHover={{ background: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.22)" }}
          whileTap={{ scale: 0.92 }}
          onClick={handleGoHome}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M8.5 2.5L4 7l4.5 4.5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{
            fontSize: "clamp(0.72rem, 1.5vw, 0.85rem)",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.65)",
            whiteSpace: "nowrap",
          }}>
            首页
          </span>
        </motion.button>
      )}

      <Scene1Intro />
      <Scene2Title name={data.name} />
      <Scene3Cards cardPhotos={cardPhotos} />

      {/* 蜡烛幕（Scene4.5）*/}
      <Scene4_5Candle
        onEnter={handleCandleEnter}
        onBlown={handleCandleBlown}
      />

      {/* 礼物幕（蜡烛吹灭后才能滚动到，未吹灭时仍存在但被蜡烛幕阻挡） */}
      <div ref={giftRef}>
        <Scene4Gift onOpen={handleGiftOpen} />
      </div>

      <div ref={scene5Ref}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={giftOpened ? { opacity: 1 } : { opacity: 0 }}
          transition={{ ...springGentle, delay: 0.3 }}
        >
          <Scene5Letter
            giftLetter={data.giftLetter}
            letterAlign={data.letterAlign}
            hasPhotos={data.giftImages.length > 0}
            started={giftOpened}
            onLetterDone={data.giftImages.length > 0 ? handleLetterDone : undefined}
          />
          {data.giftImages.length > 0 && (
            <div ref={scene5PhotosRef}>
              <Scene5Photos giftImages={data.giftImages} />
            </div>
          )}
        </motion.div>
      </div>

      <Scene6Uplift />
      <Scene7Ending name={data.name} onVisible={handleEndingVisible} />

      {/* 音乐开关提示 — 结尾出现后常驻 */}
      <AnimatePresence>
        {endingVisible && (
          <motion.button
            className="fixed z-50 select-none"
            style={{ bottom: "1.5rem", left: "50%", transform: "translateX(-50%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ ...springGentle, delay: 1.2 }}
            onClick={handleMusicToggle}
          >
            <span
              style={{
                fontSize: "clamp(0.72rem, 1.4vw, 0.85rem)",
                letterSpacing: "0.35em",
                color: "rgba(255,255,255,0.40)",
                display: "block",
                transition: "color 0.3s ease",
              }}
            >
              {musicOn ? "· 关闭音乐 ·" : "· 开启音乐 ·"}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Demo 结尾 CTA */}
      <AnimatePresence>
        {endingCTA && endingVisible && (
          <motion.div
            className="fixed bottom-12 left-0 right-0 flex flex-col items-center gap-4 z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springGentle, delay: 1.0 }}
          >
            {endingCTA(handleNavigateAway)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 创作者悬浮操作栏 */}
      {isCreator && shareUrl && (
        <CreatorToolbar shareUrl={shareUrl} sessionId={sessionId} onNavigateAway={handleNavigateAway} />
      )}
    </div>
  );
}
