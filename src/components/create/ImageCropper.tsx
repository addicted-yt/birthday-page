"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import { SpringButton } from "@/components/ui/SpringButton";

interface ImageCropperProps {
  src: string;
  onDone: (dataUrl: string) => void;
  onCancel: () => void;
}

const CROP_MAX_DIMENSION = 900;
const CROP_QUALITY = 0.82;

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => { image.onload = resolve; });

  // 裁剪区域按比例缩放，最长边不超过 1200px
  const scale = Math.min(1, CROP_MAX_DIMENSION / Math.max(pixelCrop.width, pixelCrop.height));
  const outW = Math.round(pixelCrop.width * scale);
  const outH = Math.round(pixelCrop.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH
  );

  return canvas.toDataURL("image/jpeg", CROP_QUALITY);
}

export function ImageCropper({ src, onDone, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [mounted, setMounted] = useState(false);
  const croppedAreaPixelsRef = useRef<Area | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    croppedAreaPixelsRef.current = croppedAreaPixels;
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixelsRef.current) return;
    const dataUrl = await getCroppedImg(src, croppedAreaPixelsRef.current);
    onDone(dataUrl);
  };

  if (!mounted) return null;

  const content = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
      }}
    >
      <div style={{ position: "relative", width: "min(360px, 100%)", height: "min(360px, 70vw)", borderRadius: "12px", overflow: "hidden" }}>
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={4 / 5}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          style={{
            containerStyle: { borderRadius: "12px" },
            cropAreaStyle: { border: "1px solid rgba(255,255,255,0.3)" },
          }}
        />
      </div>

      <div style={{ marginTop: "24px", width: "min(360px, 100%)", padding: "0 8px" }}>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-white/60"
        />
        <p className="text-center text-xs text-white/30 mt-1 tracking-wider">缩放</p>
      </div>

      <div className="flex gap-4 mt-6">
        <SpringButton variant="secondary" onClick={onCancel}>取消</SpringButton>
        <SpringButton variant="primary" onClick={handleDone}>确认裁剪</SpringButton>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

