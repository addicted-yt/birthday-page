"use client";
import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { BirthdayData, CardPhoto } from "@/types/birthday";
import { decodeBirthdayData } from "@/lib/urlEncoding";
import { idbGet, fetchImageFromR2 } from "@/lib/imageStorage";
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
  const decodedFromUrl = !propData && encodedData ? decodeBirthdayData(encodedData, sessionId) : null;
  const fallbackName = encodedName
    ? (() => {
        try {
          return decodeURIComponent(encodedName);
        } catch {
          return encodedName;
        }
      })()
    : "";
  const [data, setData] = useState<BirthdayData | null>(
    propData ||
      decodedFromUrl ||
      (encodedData
        ? ({
            v: 1,
            name: fallbackName,
            giftLetter: "",
            cardPhotos: [],
            giftImages: [],
          } as BirthdayData)
        : null)
  );
  const [decodeError] = useState(Boolean(!propData && encodedData && !decodedFromUrl));
  const [navigatingAway, setNavigatingAway] = useState(false);
  const [giftOpened, setGiftOpened] = useState(false);
  const [endingVisible, setEndingVisible] = useState(false);
  const [musicOn, setMusicOn] = useState(false);

  const birthdaySong = useAudioPlayer("/audio/birthday-song.mp3");
  const pianoMusic = useAudioPlayer("/audio/gift-bgm.mp3");

  const birthdaySongStarted = useRef(false);
  const birthdayFadePromiseRef = useRef<Promise<void> | null>(null);
  const birthdayExitedCakeRef = useRef(false);
  const activeTrackRef = useRef<"birthday" | "gift" | null>(null);
  const micPromptActiveRef = useRef(false);
  const pianoStarted = useRef(false);

  const giftRef = useRef<HTMLElement | null>(null);
  const scene5Ref = useRef<HTMLElement | null>(null);
  const scene5PhotosRef = useRef<HTMLElement | null>(null);

  const shareUrl =
    typeof window !== "undefined" && encodedData
      ? `${window.location.origin}/result?d=${encodedData}`
      : "";

  const scrollToSection = useCallback((target: HTMLElement | null, delay = 0) => {
    if (!target) return;
    const run = () => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 180);
    };

    if (delay > 0) {
      window.setTimeout(run, delay);
    } else {
      run();
    }
  }, []);

  const { cancel: cancelFirstInteraction } = useFirstInteraction(
    useCallback(() => {
      birthdaySong.unlock();
    }, [birthdaySong])
  );

  useEffect(() => {
    if (!data) return;
    const hasImageKeys =
      data.cardPhotos.some((photo) => photo.imageKey && !photo.dataUrl) ||
      data.giftImages.some((image) => image.imageKey && !image.dataUrl);
    if (!hasImageKeys) return;

    let cancelled = false;
    (async () => {
      const cardPhotos = await Promise.all(
        data.cardPhotos.map(async (photo) => {
          if (photo.dataUrl || !photo.imageKey) return photo;
          const url = (await idbGet(photo.imageKey)) ?? (await fetchImageFromR2(photo.imageKey));
          return url ? { ...photo, dataUrl: url } : photo;
        })
      );

      const giftImages = await Promise.all(
        data.giftImages.map(async (image) => {
          if (image.dataUrl || !image.imageKey) return image;
          const url = (await idbGet(image.imageKey)) ?? (await fetchImageFromR2(image.imageKey));
          return url ? { ...image, dataUrl: url } : image;
        })
      );

      if (!cancelled) {
        setData((prev) => (prev ? { ...prev, cardPhotos, giftImages } : prev));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data?.cardPhotos.map((photo) => photo.imageKey).join(","), data?.giftImages.map((image) => image.imageKey).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const ensureBirthdaySongStopped = useCallback(() => {
    if (birthdayFadePromiseRef.current) return birthdayFadePromiseRef.current;
    if (!birthdaySongStarted.current) return Promise.resolve();

    birthdayFadePromiseRef.current = new Promise<void>((resolve) => {
      birthdaySong.fadeOut(() => {
        birthdaySongStarted.current = false;
        if (activeTrackRef.current === "birthday") {
          activeTrackRef.current = null;
        }
        setMusicOn(false);
        birthdayFadePromiseRef.current = null;
        resolve();
      });
    });

    return birthdayFadePromiseRef.current;
  }, [birthdaySong]);

  const handleCandleEnter = useCallback(() => {
    if (birthdaySongStarted.current) return;
    birthdayExitedCakeRef.current = false;
    birthdaySongStarted.current = true;
    activeTrackRef.current = "birthday";
    birthdaySong.fadeIn(0.72);
    setMusicOn(true);
  }, [birthdaySong]);

  const handleCandleBlown = useCallback(() => {
    birthdayExitedCakeRef.current = true;
    void ensureBirthdaySongStopped();
    requestAnimationFrame(() => {
      scrollToSection(giftRef.current);
    });
  }, [ensureBirthdaySongStopped, scrollToSection]);

  const handleGiftEnter = useCallback(() => {
    birthdayExitedCakeRef.current = true;
    void ensureBirthdaySongStopped();
  }, [ensureBirthdaySongStopped]);

  const handleGiftOpen = useCallback(() => {
    const openGiftFlow = async () => {
      setGiftOpened(true);
      if (!pianoStarted.current) {
        pianoStarted.current = true;
        activeTrackRef.current = "gift";
        pianoMusic.playMuted();
      } else {
        activeTrackRef.current = "gift";
      }
      await ensureBirthdaySongStopped();
      pianoMusic.fadeIn(0.65);
      setMusicOn(true);
      requestAnimationFrame(() => {
        scrollToSection(scene5Ref.current);
      });
    };

    void openGiftFlow();
  }, [ensureBirthdaySongStopped, pianoMusic, scrollToSection]);

  const handleLetterDone = useCallback(() => {
    if (!scene5PhotosRef.current) return;
    scrollToSection(scene5PhotosRef.current, 300);
  }, [scrollToSection]);

  const handleEndingVisible = useCallback(() => {
    setEndingVisible(true);
  }, []);

  const handleNavigateAway = useCallback(() => {
    cancelFirstInteraction();
    birthdaySong.stop();
    pianoMusic.stop();
    setMusicOn(false);
    onNavigateAway?.();
  }, [birthdaySong, pianoMusic, cancelFirstInteraction, onNavigateAway]);

  const handleGoHome = useCallback(() => {
    cancelFirstInteraction();
    birthdaySong.stop();
    pianoMusic.stop();
    setMusicOn(false);
    setNavigatingAway(true);
    setTimeout(() => router.push("/"), 380);
  }, [birthdaySong, pianoMusic, cancelFirstInteraction, router]);

  const handleMusicToggle = useCallback(() => {
    if (pianoStarted.current || giftOpened || activeTrackRef.current === "gift") {
      const willPlay = !pianoMusic.isPlaying();
      birthdaySong.stop();
      birthdaySongStarted.current = false;
      pianoMusic.toggle();
      setMusicOn(willPlay);
    } else if (birthdaySongStarted.current || activeTrackRef.current === "birthday") {
      const willPlay = !birthdaySong.isPlaying();
      birthdaySong.toggle();
      setMusicOn(willPlay);
    }
  }, [giftOpened, pianoMusic, birthdaySong]);

  const handleMicPromptChange = useCallback((active: boolean) => {
    micPromptActiveRef.current = active;
  }, []);

  const handleMicEnded = useCallback(() => {
    if (!birthdaySongStarted.current) return;
    birthdaySong.refreshAfterInterruption(0.72);
    setMusicOn(true);
  }, [birthdaySong]);

  useEffect(() => {
    const onHide = () => {
      birthdaySong.stop();
      pianoMusic.stop();
      activeTrackRef.current = null;
      setMusicOn(false);
    };

    const onVisibility = () => {
      if (document.hidden && !micPromptActiveRef.current) onHide();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
    };
  }, [birthdaySong, pianoMusic]);

  if (!data) {
    return (
      <div className="h-dvh flex items-center justify-center" style={{ background: "#080d1a" }}>
        <p className="text-white/20 text-xs tracking-[0.4em]">loading</p>
      </div>
    );
  }

  if (decodeError && !data.giftLetter && data.cardPhotos.length === 0) {
    // Keep rendering a minimal result shell instead of trapping the user on loading.
  }

  const cardPhotos = (() => {
    if (data.cardPhotos.length > 0) return data.cardPhotos;
    const phrases: string[] = Array.isArray(data.placeholderPhrases)
      ? data.placeholderPhrases
      : data.placeholderPhrase
        ? [data.placeholderPhrase]
        : [];

    return getDefaultCardPlaceholders(phrases).map(({ dataUrl, phrase }, index) => {
      const style = data.placeholderStyles?.[index];
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
          <span
            style={{
              fontSize: "clamp(0.72rem, 1.5vw, 0.85rem)",
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.65)",
              whiteSpace: "nowrap",
            }}
          >
            首页
          </span>
        </motion.button>
      )}

      <Scene1Intro />
      <Scene2Title name={data.name} />
      <Scene3Cards cardPhotos={cardPhotos} />

      <Scene4_5Candle
        onEnter={handleCandleEnter}
        onBlown={handleCandleBlown}
        onMicEnded={handleMicEnded}
        onMicPromptChange={handleMicPromptChange}
      />

      <Scene4Gift sectionRef={giftRef} onOpen={handleGiftOpen} onEnter={handleGiftEnter} />

      <Scene5Letter
        sectionRef={scene5Ref}
        giftLetter={data.giftLetter}
        letterAlign={data.letterAlign}
        hasPhotos={data.giftImages.length > 0}
        started={giftOpened}
        onLetterDone={data.giftImages.length > 0 ? handleLetterDone : undefined}
      />

      {data.giftImages.length > 0 && (
        <Scene5Photos sectionRef={scene5PhotosRef} giftImages={data.giftImages} />
      )}

      <Scene6Uplift />
      <Scene7Ending name={data.name} onVisible={handleEndingVisible} />

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

      {isCreator && shareUrl && (
        <CreatorToolbar shareUrl={shareUrl} sessionId={sessionId} onNavigateAway={handleNavigateAway} />
      )}
    </div>
  );
}
