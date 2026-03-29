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
import { Scene0Curtain } from "./Scene0Curtain";
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
  // isCreator（预览页）跳过引导幕，其他情况（收件人/demo）显示
  const [showCurtain, setShowCurtain] = useState(!isCreator);
  // 引导幕消散动画完成后才渲染底层内容，确保第一幕动画全新开始
  const [curtainDone, setCurtainDone] = useState(isCreator);

  const birthdaySong = useAudioPlayer("/audio/birthday-song.mp3");
  const pianoMusic = useAudioPlayer("/audio/gift-bgm.mp3");

  const birthdaySongStarted = useRef(false);
  const birthdayFadePromiseRef = useRef<Promise<void> | null>(null);
  const birthdayExitedCakeRef = useRef(false);
  const activeTrackRef = useRef<"birthday" | "gift" | null>(null);
  const micPromptActiveRef = useRef(false);
  const pianoStarted = useRef(false);
  const handleCandleEnterRef = useRef<() => void>(() => {});

  const giftRef = useRef<HTMLElement | null>(null);
  const scene5Ref = useRef<HTMLElement | null>(null);
  const scene5PhotosRef = useRef<HTMLElement | null>(null);

  // shareUrl 必须从原始 location.search 截取 d/name 参数，不能用 searchParams.get()
  // 因为 searchParams.get 会把 + 解码成空格，重新拼 URL 就会出现空格导致链接断裂
  // origin 固定用 thesedays.cn，确保收件方走 Cloudflare Workers（有 R2 binding）
  const shareUrl = (() => {
    if (typeof window === "undefined" || !encodedData) return "";
    const raw = window.location.search;
    const dMatch = raw.match(/[?&]d=([^&]*)/);
    const rawD = dMatch ? dMatch[1] : encodeURIComponent(encodedData);
    const nameMatch = raw.match(/[?&]name=([^&]*)/);
    const rawName = nameMatch ? nameMatch[1] : (encodedName ? encodeURIComponent(encodedName) : null);
    return `https://thesedays.cn/result?d=${rawD}${rawName ? `&name=${rawName}` : ""}`;
  })();

  const scrollToSection = useCallback((target: HTMLElement | null, delay = 0) => {
    if (!target) return;
    const run = () => {
      const snapContainer = target.closest(".scroll-snap-y") as HTMLElement | null;
      if (snapContainer) {
        const targetTop = target.offsetTop;
        const isTouchDevice =
          "ontouchstart" in window ||
          (typeof window.matchMedia === "function" &&
            window.matchMedia("(hover: none) and (pointer: coarse)").matches);
        if (isTouchDevice) {
          // iOS Safari 上 smooth scrollTo 在 scroll-snap 容器里经常被忽略
          // 用 instant 跳转，scroll-snap 会自动 settle 到 snap 点
          snapContainer.scrollTo({ top: targetTop, behavior: "instant" });
        } else {
          // 桌面端保持平滑滚动
          snapContainer.scrollTo({ top: targetTop, behavior: "smooth" });
          window.setTimeout(() => {
            snapContainer.scrollTo({ top: target.offsetTop, behavior: "smooth" });
          }, 180);
        }
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 180);
      }
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
    console.log('[DEBUG ensureBirthdaySongStopped] called, birthdayFadePromiseRef:', !!birthdayFadePromiseRef.current, 'birthdaySongStarted:', birthdaySongStarted.current);
    if (birthdayFadePromiseRef.current) return birthdayFadePromiseRef.current;
    if (!birthdaySongStarted.current) return Promise.resolve();

    console.log('[DEBUG ensureBirthdaySongStopped] calling birthdaySong.fadeOut');
    birthdayFadePromiseRef.current = new Promise<void>((resolve) => {
      birthdaySong.fadeOut(() => {
        console.log('[DEBUG ensureBirthdaySongStopped] fadeOut onDone callback');
        birthdaySongStarted.current = false;
        if (activeTrackRef.current === "birthday") {
          activeTrackRef.current = null;
          setMusicOn(false); // 只有当前 track 是 birthday 时才关闭音乐状态
        }
        birthdayFadePromiseRef.current = null;
        resolve();
      });
    });

    return birthdayFadePromiseRef.current;
  }, [birthdaySong]);

  const handleCandleEnter = useCallback(() => {
    if (birthdaySongStarted.current) return;
    birthdaySongStarted.current = true;
    activeTrackRef.current = "birthday";
    birthdaySong.fadeIn(0.72, () => {
      // autoplay policy 阻止：重置状态后自动重试一次（延迟等待 unlock 完成）
      birthdaySongStarted.current = false;
      activeTrackRef.current = null;
      setMusicOn(false);
      // 延迟 600ms 重试：解决 unlock() 异步完成前 fadeIn 被拒的竞态问题
      // 若用户已经离开蛋糕幕则不重试
      window.setTimeout(() => {
        if (birthdaySongStarted.current || birthdayExitedCakeRef.current) return;
        handleCandleEnterRef.current();
      }, 600);
    });
    setMusicOn(true);
  }, [birthdaySong]);
  handleCandleEnterRef.current = handleCandleEnter;

  const handleCurtainStart = useCallback(() => {
    // 用户点击启幕按钮：解锁音频（在用户手势回调里，100% 可靠）然后消散引导幕
    birthdaySong.unlock();
    pianoMusic.unlock();
    setShowCurtain(false);
  }, [birthdaySong, pianoMusic]);

  const handleCandleBlown = useCallback(() => {
    birthdayExitedCakeRef.current = true;
    void ensureBirthdaySongStopped();
    // 移动端 scroll-snap 会自然滚到礼物幕，不要强制跳转（会与 scroll-snap 冲突导致弹回）
    const isTouchDevice =
      typeof window !== "undefined" &&
      ("ontouchstart" in window ||
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(hover: none) and (pointer: coarse)").matches));
    if (!isTouchDevice) {
      requestAnimationFrame(() => {
        scrollToSection(giftRef.current);
      });
    }
  }, [ensureBirthdaySongStopped, scrollToSection]);

  const handleGiftEnter = useCallback(() => {
    birthdayExitedCakeRef.current = true;
    // 强制重置状态，确保 ensureBirthdaySongStopped 不被 birthdaySongStarted=false 拦截
    // 移动端 autoplay 重试期间 birthdaySongStarted 可能为 false，但 audio 实际在播
    birthdaySongStarted.current = true;
    birthdayFadePromiseRef.current = null;
    void ensureBirthdaySongStopped();
  }, [ensureBirthdaySongStopped]);

  const handleGiftTap = useCallback(() => {
    // 点击礼物瞬间立即启动：停止 birthday song、预启动 piano（静音），不等 1400ms 动画
    // 注意：setGiftOpened 不在这里调用，避免信件字幕在滚动前提前开始
    if (!pianoStarted.current) {
      pianoStarted.current = true;
      activeTrackRef.current = "gift";
      pianoMusic.playMuted();
    } else {
      activeTrackRef.current = "gift";
    }
    void ensureBirthdaySongStopped();
  }, [ensureBirthdaySongStopped, pianoMusic]);

  const handleGiftOpen = useCallback(() => {
    const openGiftFlow = async () => {
      setGiftOpened(true);  // 在这里设置，确保信件动画在滚动后才开始
      activeTrackRef.current = "gift"; // 提前设置，防止 ensureBirthdaySongStopped 的 onDone 覆盖 musicOn
      // 立即滚动，不等 birthday song fadeOut
      const isTouchDevice =
        typeof window !== "undefined" &&
        ("ontouchstart" in window ||
          (typeof window.matchMedia === "function" &&
            window.matchMedia("(hover: none) and (pointer: coarse)").matches));
      if (isTouchDevice) {
        window.setTimeout(() => { scrollToSection(scene5Ref.current); }, 100);
      } else {
        requestAnimationFrame(() => { scrollToSection(scene5Ref.current); });
      }
      await ensureBirthdaySongStopped();
      pianoMusic.fadeIn(0.65);
      setMusicOn(true);
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

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 移动端：监听 scroll 容器滚动，蛋糕幕离屏后强制淡出 birthday song
  // 比子组件内部检测更可靠——容器自身的 scroll 事件在所有移动端浏览器中稳定触发
  useEffect(() => {
    const isTouchDevice =
      typeof window !== "undefined" &&
      ("ontouchstart" in window ||
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(hover: none) and (pointer: coarse)").matches));
    if (!isTouchDevice) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      // 蛋糕幕是第4个 section（index 3），每个 section 高度 100dvh
      // scrollTop 超过 3.5 个屏幕高度说明已滚过蛋糕幕
      if (container.scrollTop > window.innerHeight * 3.5) {
        console.log('[DEBUG] scroll detected, scrollTop:', container.scrollTop, 'threshold:', window.innerHeight * 3.5, 'birthdayExited:', birthdayExitedCakeRef.current);
        if (birthdayExitedCakeRef.current) return; // 已经处理过，不重复
        console.log('[DEBUG] triggering ensureBirthdaySongStopped');
        birthdayExitedCakeRef.current = true;
        birthdaySongStarted.current = true;  // 强制重置，防止 autoplay 重试期间值为 false
        birthdayFadePromiseRef.current = null; // 清除卡住的 promise 锁
        void ensureBirthdaySongStopped();
      }
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [ensureBirthdaySongStopped]);

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

  // 临时调试：移动端加载 vConsole
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouchDevice =
      "ontouchstart" in window ||
      (typeof window.matchMedia === "function" &&
        window.matchMedia("(hover: none) and (pointer: coarse)").matches);
    if (!isTouchDevice) return;
    const script = document.createElement("script");
    script.src = "https://unpkg.com/vconsole@latest/dist/vconsole.min.js";
    script.onload = () => {
      // @ts-ignore
      new window.VConsole();
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div ref={scrollContainerRef} className="scroll-snap-y relative" style={{ background: "#080d1a" }}>
      <CosmicBackground />
      <PageTransitionOverlay leaving={navigatingAway} entering />

      <AnimatePresence onExitComplete={() => setCurtainDone(true)}>
        {showCurtain && <Scene0Curtain onStart={handleCurtainStart} />}
      </AnimatePresence>

      {curtainDone && showHomeButton && (
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

      <Scene1Intro started={curtainDone} />
      <Scene2Title name={data.name} />
      <Scene3Cards cardPhotos={cardPhotos} />

      <Scene4_5Candle
        onEnter={handleCandleEnter}
        onExiting={() => {
          birthdayExitedCakeRef.current = true;
          // 强制重置，防止 birthdaySongStarted=false 或卡住的 promise 拦截 fadeOut
          birthdaySongStarted.current = true;
          birthdayFadePromiseRef.current = null;
          void ensureBirthdaySongStopped();
        }}
        onBlown={handleCandleBlown}
        onMicEnded={handleMicEnded}
        onMicPromptChange={handleMicPromptChange}
      />

      <Scene4Gift sectionRef={giftRef} onTap={handleGiftTap} onOpen={handleGiftOpen} onEnter={handleGiftEnter} />

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
