"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { CreateFlowState, CreateStep, BirthdayData } from "@/types/birthday";
import { springGentle } from "@/lib/animationPresets";
import { encodeBirthdayData } from "@/lib/urlEncoding";
import { idbPut, uploadImageToR2 } from "@/lib/imageStorage";
import { BrandFooter } from "@/components/landing/BrandFooter";
import { PageTransitionOverlay } from "@/components/ui/PageTransitionOverlay";
import { Step1Name } from "./Step1Name";
import { Step2Photos } from "./Step2Photos";
import { Step3CardText } from "./Step3CardText";
import { Step4GiftLetter } from "./Step4GiftLetter";
import { Step5GiftImages } from "./Step5GiftImages";
import { Step6Preview } from "./Step6Preview";

const SubtleBackground = dynamic(
  () => import("@/components/ui/SubtleBackground").then((m) => m.SubtleBackground),
  { ssr: false }
);

const DEFAULT_LETTER = `谢谢你来到这个世界

有些人像星星一样
让夜空变得更亮

愿未来的每一天
都有光
有梦想
有爱`;

const TOTAL_STEPS = 6;

function restoreStateFromSid(sid: string): CreateFlowState | null {
  try {
    const stored = sessionStorage.getItem(sid);
    if (!stored) return null;
    const data = JSON.parse(stored) as BirthdayData;
    return {
      step: 6,
      name: data.name,
      cardPhotos: data.cardPhotos,
      giftLetter: data.giftLetter,
      letterAlign: data.letterAlign,
      giftImages: data.giftImages,
      placeholderPhrases: data.placeholderPhrases,
      placeholderStyles: data.placeholderStyles,
    };
  } catch {
    return null;
  }
}

export function StepFlow({ restoreSid }: { restoreSid?: string | null }) {
  const router = useRouter();
  const [navigatingAway, setNavigatingAway] = useState(false);
  const [state, setState] = useState<CreateFlowState>({
    step: 1,
    name: "",
    cardPhotos: [],
    giftLetter: DEFAULT_LETTER,
    giftImages: [],
  });

  // 是否曾经到达过 step6（包括从预览页返回的情况）
  const hasReachedPreview = useRef(false);
  if (state.step === 6) hasReachedPreview.current = true;

  // 客户端挂载后再从 sessionStorage 恢复，避免 SSR/客户端 hydration 不匹配
  useEffect(() => {
    if (restoreSid) {
      const restored = restoreStateFromSid(restoreSid);
      if (restored) {
        hasReachedPreview.current = true;
        setState(restored);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNext = () =>
    setState((s) => ({ ...s, step: Math.min(TOTAL_STEPS, s.step + 1) as CreateStep }));
  const goBack = () =>
    setState((s) => ({ ...s, step: Math.max(1, s.step - 1) as CreateStep }));
  const goToStep = (step: CreateStep) => setState((s) => ({ ...s, step }));

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /**
   * 上传所有图片到 R2 + IndexedDB，返回带 imageKey 的数据
   * 任意一张上传失败则抛出错误，阻止生成分享链接（不静默降级）
   */
  const prepareImages = async (): Promise<{ cardPhotos: typeof state.cardPhotos; giftImages: typeof state.giftImages }> => {
    const cardPhotos = await Promise.all(
      state.cardPhotos.map(async (p) => {
        if (!p.dataUrl) return p;
        // 存入本地 IndexedDB（创建者永久可用）
        const localKey = `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await idbPut(localKey, p.dataUrl);
        // 上传到 R2（收件人通过链接访问），失败则抛出
        const imageKey = await uploadImageToR2(p.dataUrl);
        return { ...p, imageKey };
      })
    );
    const giftImages = await Promise.all(
      state.giftImages.map(async (g) => {
        if (!g.dataUrl) return g;
        const localKey = `gift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await idbPut(localKey, g.dataUrl);
        const imageKey = await uploadImageToR2(g.dataUrl);
        return { ...g, imageKey };
      })
    );
    return { cardPhotos, giftImages };
  };

  const buildUrl = (cardPhotos: typeof state.cardPhotos, giftImages: typeof state.giftImages) => {
    const { d, sid, name } = encodeBirthdayData({
      v: 1,
      name: state.name,
      cardPhotos,
      giftLetter: state.giftLetter,
      letterAlign: state.letterAlign,
      giftImages,
      placeholderPhrases: state.placeholderPhrases,
      placeholderStyles: state.placeholderStyles,
    });
    return { d, sid, name, url: `${window.location.origin}/result?d=${d}&sid=${sid}&name=${name}` };
  };

  const handlePreview = async () => {
    setUploading(true);
    setUploadError(null);
    try {
      const { cardPhotos, giftImages } = await prepareImages();
      const { d, sid, name } = buildUrl(cardPhotos, giftImages);
      setNavigatingAway(true);
      setTimeout(() => router.push(`/result?d=${d}&sid=${sid}&name=${name}&creator=1`), 380);
    } catch {
      setUploadError("图片上传失败，请检查网络后重试");
      setUploading(false);
    }
  };

  const showGoToStep = hasReachedPreview.current;

  return (
    <div
      className="relative h-dvh flex flex-col items-center px-6 py-24 overflow-y-auto"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #111d40 0%, #080d1a 75%)" }}
    >
      <SubtleBackground />
      <PageTransitionOverlay leaving={navigatingAway} entering />
      {/* 返回首页 — 仅 step1 显示，左上角 */}
      <AnimatePresence>
        {state.step === 1 && (
          <motion.button
            key="back-home"
            className="fixed z-20 flex items-center gap-2"
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
            exit={{ opacity: 0, x: -10 }}
            transition={{
              ...springGentle,
              scale: { type: "spring", damping: 12, stiffness: 500 },
            }}
            whileHover={{ background: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.22)" }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              setNavigatingAway(true);
              setTimeout(() => router.push("/"), 380);
            }}
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
      </AnimatePresence>

      {/* Progress dots */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all duration-700"
            style={{
              background: i + 1 === state.step ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.18)",
              transform: i + 1 === state.step ? "scale(1.4)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.step}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ ...springGentle }}
          className="w-full max-w-md z-10 my-auto"
        >
          {state.step === 1 && (
            <Step1Name
              name={state.name}
              onChange={(name) => setState((s) => ({ ...s, name }))}
              onNext={goNext}
            />
          )}
          {state.step === 2 && (
            <Step2Photos
              photos={state.cardPhotos}
              onChange={(cardPhotos) => setState((s) => ({ ...s, cardPhotos }))}
              onNext={goNext}
              onBack={goBack}
              showGoToStep={showGoToStep}
              onGoToStep={goToStep}
            />
          )}
          {state.step === 3 && (
            <Step3CardText
              photos={state.cardPhotos}
              onChange={(cardPhotos) => setState((s) => ({ ...s, cardPhotos }))}
              phrases={state.placeholderPhrases}
              onPhrasesChange={(placeholderPhrases) => setState((s) => ({ ...s, placeholderPhrases }))}
              placeholderStyles={state.placeholderStyles}
              onStylesChange={(placeholderStyles) => setState((s) => ({ ...s, placeholderStyles }))}
              onNext={goNext}
              onBack={goBack}
              showGoToStep={showGoToStep}
              onGoToStep={goToStep}
            />
          )}
          {state.step === 4 && (
            <Step4GiftLetter
              letter={state.giftLetter}
              letterAlign={state.letterAlign}
              onChange={(giftLetter) => setState((s) => ({ ...s, giftLetter }))}
              onAlignChange={(letterAlign) => setState((s) => ({ ...s, letterAlign }))}
              onNext={goNext}
              onBack={goBack}
              showGoToStep={showGoToStep}
              onGoToStep={goToStep}
            />
          )}
          {state.step === 5 && (
            <Step5GiftImages
              images={state.giftImages}
              onChange={(giftImages) => setState((s) => ({ ...s, giftImages }))}
              onNext={goNext}
              onBack={goBack}
              showGoToStep={showGoToStep}
              onGoToStep={goToStep}
            />
          )}
          {state.step === 6 && (
            <Step6Preview
              state={state}
              onPreview={handlePreview}
              onBack={goBack}
              onGoToStep={goToStep}
              uploading={uploading}
              uploadError={uploadError}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-6 z-10">
        <BrandFooter opacity={0.3} />
      </div>
    </div>
  );
}
