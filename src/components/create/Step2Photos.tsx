"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { CardPhoto, CreateStep } from "@/types/birthday";
import { SpringButton } from "@/components/ui/SpringButton";
import { ImageCropper } from "./ImageCropper";
import { imageFileToBase64 } from "@/lib/imageToBase64";
import { GoToStepBar } from "./GoToStepBar";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_CARD_PHOTOS = 5;

interface Step2PhotosProps {
  photos: CardPhoto[];
  onChange: (photos: CardPhoto[]) => void;
  onNext: () => void;
  onBack: () => void;
  showGoToStep?: boolean;
  onGoToStep?: (step: CreateStep) => void;
}

export function Step2Photos({
  photos,
  onChange,
  onNext,
  onBack,
  showGoToStep,
  onGoToStep,
}: Step2PhotosProps) {
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropIndex, setCropIndex] = useState<number>(-1);
  const [sizeError, setSizeError] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const sizeErrorTimerRef = useRef<number | null>(null);

  const showSizeErrorBriefly = useCallback(() => {
    setSizeError(true);
    if (sizeErrorTimerRef.current) {
      window.clearTimeout(sizeErrorTimerRef.current);
    }
    sizeErrorTimerRef.current = window.setTimeout(() => {
      setSizeError(false);
      sizeErrorTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (sizeErrorTimerRef.current) {
        window.clearTimeout(sizeErrorTimerRef.current);
      }
    };
  }, []);

  const openNextFile = useCallback(async (files: File[], nextIndex: number) => {
    if (files.length === 0) {
      setPendingFiles([]);
      return;
    }

    let remaining = [...files];
    let skippedOversize = false;

    while (remaining.length > 0) {
      const [file, ...rest] = remaining;
      remaining = rest;

      if (file.size > MAX_FILE_BYTES) {
        skippedOversize = true;
        continue;
      }

      if (skippedOversize) {
        showSizeErrorBriefly();
      } else {
        setSizeError(false);
      }

      const base64 = await imageFileToBase64(file);
      setCropSrc(base64);
      setCropIndex(nextIndex);
      setPendingFiles(remaining);
      return;
    }

    if (skippedOversize) {
      showSizeErrorBriefly();
    } else {
      setSizeError(false);
    }
    setPendingFiles([]);
  }, [showSizeErrorBriefly]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const slots = MAX_CARD_PHOTOS - photos.length;
    const toProcess = files.slice(0, slots);
    e.target.value = "";
    if (toProcess.length === 0) return;
    await openNextFile(toProcess, photos.length);
  }, [photos, openNextFile]);

  const handleCropDone = useCallback((dataUrl: string) => {
    const updated = [...photos];
    if (cropIndex >= updated.length) {
      updated.push({ dataUrl });
    } else {
      updated[cropIndex] = { ...updated[cropIndex], dataUrl };
    }
    onChange(updated);
    setCropSrc(null);
    setCropIndex(-1);

    if (pendingFiles.length > 0 && updated.length < MAX_CARD_PHOTOS) {
      void openNextFile(pendingFiles, updated.length);
    } else {
      setPendingFiles([]);
    }
  }, [photos, cropIndex, onChange, pendingFiles, openNextFile]);

  const handleRemove = (index: number) => {
    onChange(photos.filter((_, photoIndex) => photoIndex !== index));
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onDone={handleCropDone}
          onCancel={() => {
            setCropSrc(null);
            setCropIndex(-1);
            setPendingFiles([]);
          }}
        />
      )}

      <div className="text-center">
        <p className="tracking-[0.3em] text-white/45 mb-4" style={{ fontSize: "clamp(0.82rem, 1.6vw, 1rem)" }}>
          STEP 02
        </p>
        <h2 className="font-extralight tracking-wide text-white/92" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>
          上传卡片照片
        </h2>
        <p className="text-white/45 mt-2 tracking-wider" style={{ fontSize: "clamp(0.75rem, 1.3vw, 0.9rem)" }}>
          可选 · 最多 5 张 · 建议 4:5 比例
        </p>
        <p className="text-xs mt-1 tracking-wider" style={{ color: "rgba(255,255,255,0.38)" }}>
          未上传则自动使用精心设计的默认卡片
        </p>
        {sizeError && (
          <p className="text-xs mt-2 tracking-wider" style={{ color: "rgba(255,120,80,0.9)" }}>
            图片超过 5MB，已自动跳过超限文件
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative bg-white/5 border border-white/10 rounded-lg overflow-hidden"
            style={{ aspectRatio: "4/5" }}
          >
            <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            <button
              onClick={() => handleRemove(index)}
              className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full text-white/70 flex items-center justify-center text-xs hover:bg-black/80 transition-colors"
            >
              ×
            </button>
          </div>
        ))}

        {photos.length < MAX_CARD_PHOTOS && (
          <label
            className="relative bg-white/3 border border-dashed border-white/15 rounded-lg overflow-hidden cursor-pointer hover:border-white/30 transition-colors flex items-center justify-center"
            style={{ aspectRatio: "4/5" }}
          >
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            <span className="text-white/25 text-2xl font-light">+</span>
          </label>
        )}
      </div>

      <div className="flex gap-4">
        <SpringButton variant="secondary" onClick={onBack}>返回</SpringButton>
        <SpringButton variant="primary" onClick={onNext}>
          {photos.length > 0 ? `下一步 (${photos.length}/${MAX_CARD_PHOTOS})` : "跳过"}
        </SpringButton>
      </div>

      {showGoToStep && onGoToStep && (
        <GoToStepBar currentStep={2} onGoToStep={onGoToStep} />
      )}
    </div>
  );
}
