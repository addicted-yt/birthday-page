"use client";
import { useState, useCallback } from "react";
import { CardPhoto, CreateStep } from "@/types/birthday";
import { SpringButton } from "@/components/ui/SpringButton";
import { ImageCropper } from "./ImageCropper";
import { imageFileToBase64 } from "@/lib/imageToBase64";
import { GoToStepBar } from "./GoToStepBar";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface Step2PhotosProps {
  photos: CardPhoto[];
  onChange: (photos: CardPhoto[]) => void;
  onNext: () => void;
  onBack: () => void;
  showGoToStep?: boolean;
  onGoToStep?: (step: CreateStep) => void;
}

export function Step2Photos({ photos, onChange, onNext, onBack, showGoToStep, onGoToStep }: Step2PhotosProps) {
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropIndex, setCropIndex] = useState<number>(-1);
  const [sizeError, setSizeError] = useState(false);
  // Queue of remaining files to crop after the current one
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const openNextFile = useCallback(async (files: File[], baseCount: number) => {
    if (files.length === 0) return;
    const [file, ...rest] = files;
    if (file.size > MAX_FILE_BYTES) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 3000);
      // Skip this file, try next
      openNextFile(rest, baseCount);
      return;
    }
    setSizeError(false);
    const base64 = await imageFileToBase64(file);
    setCropSrc(base64);
    // cropIndex = baseCount + how many from this batch have been accepted so far
    // We track accepted count via pendingFiles length difference, but simpler:
    // just use photos.length at the moment of opening — photos state updates after each done
    setCropIndex(baseCount);
    setPendingFiles(rest);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const slots = 5 - photos.length;
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
    // Open next pending file; new photos count = updated.length
    if (pendingFiles.length > 0 && updated.length < 5) {
      openNextFile(pendingFiles, updated.length);
    } else {
      setPendingFiles([]);
    }
  }, [photos, cropIndex, onChange, pendingFiles, openNextFile]);

  const handleRemove = (i: number) => {
    onChange(photos.filter((_, idx) => idx !== i));
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onDone={handleCropDone}
          onCancel={() => { setCropSrc(null); setCropIndex(-1); setPendingFiles([]); }}
        />
      )}

      <div className="text-center">
        <p className="tracking-[0.3em] text-white/45 mb-4" style={{ fontSize: "clamp(0.82rem, 1.6vw, 1rem)" }}>STEP 02</p>
        <h2 className="font-extralight tracking-wide text-white/92" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>
          上传卡片照片
        </h2>
        <p className="text-white/45 mt-2 tracking-wider" style={{ fontSize: "clamp(0.75rem, 1.3vw, 0.9rem)" }}>可选 · 最多 5 张 · 建议 4:5 比例</p>
        <p className="text-xs mt-1 tracking-wider" style={{ color: "rgba(255,255,255,0.38)" }}>未上传则自动使用精心设计的默认卡片</p>
        {sizeError && (
          <p className="text-xs mt-2 tracking-wider" style={{ color: "rgba(255,120,80,0.9)" }}>图片超过 5MB，请选择更小的文件</p>
        )}
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {photos.map((photo, i) => (
          <div
            key={i}
            className="relative bg-white/5 border border-white/10 rounded-lg overflow-hidden"
            style={{ aspectRatio: "4/5" }}
          >
            <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            <button
              onClick={() => handleRemove(i)}
              className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full text-white/70 flex items-center justify-center text-xs hover:bg-black/80 transition-colors"
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < 5 && (
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
          {photos.length > 0 ? `下一步 (${photos.length}/5)` : "跳过"}
        </SpringButton>
      </div>

      {showGoToStep && onGoToStep && (
        <GoToStepBar currentStep={2} onGoToStep={onGoToStep} />
      )}
    </div>
  );
}
