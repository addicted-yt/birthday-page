"use client";
import { useState } from "react";
import { GiftImage } from "@/types/birthday";
import { CreateStep } from "@/types/birthday";
import { SpringButton } from "@/components/ui/SpringButton";
import { compressImage, FileTooLargeError } from "@/lib/imageToBase64";
import { GoToStepBar } from "./GoToStepBar";

const MAX_GIFT_IMAGES = 3;

interface Step5GiftImagesProps {
  images: GiftImage[];
  onChange: (images: GiftImage[]) => void;
  onNext: () => void;
  onBack: () => void;
  showGoToStep?: boolean;
  onGoToStep?: (step: CreateStep) => void;
}

export function Step5GiftImages({ images, onChange, onNext, onBack, showGoToStep, onGoToStep }: Step5GiftImagesProps) {
  const [sizeError, setSizeError] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_GIFT_IMAGES - images.length;
    const toProcess = files.slice(0, remaining);
    const results: string[] = [];
    let hasError = false;
    for (const file of toProcess) {
      try {
        const dataUrl = await compressImage(file);
        results.push(dataUrl);
      } catch (err) {
        if (err instanceof FileTooLargeError) hasError = true;
      }
    }
    if (hasError) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 3000);
    } else {
      setSizeError(false);
    }
    if (results.length > 0) {
      onChange([...images, ...results.map((dataUrl) => ({ dataUrl }))]);
    }
    e.target.value = "";
  };

  const handleRemove = (i: number) => {
    onChange(images.filter((_, idx) => idx !== i));
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <p className="tracking-[0.3em] text-white/45 mb-4" style={{ fontSize: "clamp(0.82rem, 1.6vw, 1rem)" }}>STEP 05</p>
        <h2 className="font-extralight tracking-wide text-white/92" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>
          礼物图片
        </h2>
        <p className="text-white/45 mt-2 tracking-wider" style={{ fontSize: "clamp(0.75rem, 1.3vw, 0.9rem)" }}>可选 · 最多 3 张 · 不限比例</p>
        {sizeError && (
          <p className="text-xs mt-2 tracking-wider" style={{ color: "rgba(255,120,80,0.9)" }}>含超过 5MB 的图片已跳过，请选择更小的文件</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        {images.map((img, i) => (
          <div key={i} className="relative rounded-lg overflow-hidden bg-white/5 border border-white/10">
            <img src={img.dataUrl} alt="" className="w-full object-cover" style={{ maxHeight: "140px" }} loading="lazy" />
            <button
              onClick={() => handleRemove(i)}
              className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full text-white/70 flex items-center justify-center text-xs hover:bg-black/80 transition-colors"
            >
              ×
            </button>
          </div>
        ))}
        {images.length < MAX_GIFT_IMAGES && (
          <label className="bg-white/3 border border-dashed border-white/15 rounded-lg cursor-pointer hover:border-white/30 transition-colors flex items-center justify-center h-24">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="text-white/25 text-2xl font-light">+</span>
          </label>
        )}
      </div>

      <div className="flex gap-4">
        <SpringButton variant="secondary" onClick={onBack}>返回</SpringButton>
        <SpringButton variant="primary" onClick={onNext}>
          {images.length === 0 ? "跳过" : "下一步"}
        </SpringButton>
      </div>

      {showGoToStep && onGoToStep && (
        <GoToStepBar currentStep={5} onGoToStep={onGoToStep} />
      )}
    </div>
  );
}
