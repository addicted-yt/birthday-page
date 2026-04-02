"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { CustomAudioTrack, CreateStep } from "@/types/birthday";
import { SpringButton } from "@/components/ui/SpringButton";
import { uploadAudioToR2 } from "@/lib/imageStorage";
import { GoToStepBar } from "./GoToStepBar";

interface Step6MusicProps {
  customAudio: CustomAudioTrack[];
  onChange: (audio: CustomAudioTrack[]) => void;
  onNext: () => void;
  onBack: () => void;
  showGoToStep?: boolean;
  onGoToStep?: (step: CreateStep) => void;
}

const TRACKS = [
  { trackId: "birthday" as const, name: "生日快乐歌", scene: "蜡烛亮起时播放", src: "/audio/birthday-song.mp3" },
  { trackId: "gift" as const, name: "钢琴曲", scene: "礼物打开后播放", src: "/audio/gift-bgm.mp3" },
];

export function Step6Music({ customAudio, onChange, onNext, onBack, showGoToStep, onGoToStep }: Step6MusicProps) {
  // 每首曲目的上传状态
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  // 当前正在试听的 trackId（null = 无）
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 停止所有试听
  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingId(null);
  }, []);

  // 离开步骤时停止
  const handleNext = () => { stopPreview(); onNext(); };
  const handleBack = () => { stopPreview(); onBack(); };
  const handleGoToStep = (step: CreateStep) => { stopPreview(); onGoToStep?.(step); };

  // 页面失焦时停止
  useEffect(() => {
    const onBlur = () => stopPreview();
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("blur", onBlur);
      stopPreview();
    };
  }, [stopPreview]);

  const getTrack = (trackId: "birthday" | "gift") => customAudio.find(a => a.trackId === trackId);

  const showError = (trackId: "birthday" | "gift", msg: string) => {
    setErrors(prev => ({ ...prev, [trackId]: msg }));
    setTimeout(() => setErrors(prev => { const n = { ...prev }; delete n[trackId]; return n; }), 3000);
  };

  // 试听切换
  const handleTogglePreview = (trackId: "birthday" | "gift", defaultSrc: string) => {
    if (playingId === trackId) {
      stopPreview();
      return;
    }
    // 先停止当前播放
    stopPreview();
    const track = getTrack(trackId);
    // 优先用已上传的 dataUrl（本设备），其次用 audioKey 代理，否则用默认
    let src = defaultSrc;
    if (track?.dataUrl) src = track.dataUrl;
    else if (track?.audioKey) src = `/api/audio/${track.audioKey}`;

    const audio = new Audio(src);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    // play() 成功后才更新状态，避免静默失败时 UI 显示播放中但无声音
    audio.play().then(() => {
      setPlayingId(trackId);
    }).catch(() => {
      audioRef.current = null;
      setPlayingId(null);
    });
  };

  // 上传文件
  const handleFileChange = async (trackId: "birthday" | "gift", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.type !== "audio/mpeg" && file.type !== "audio/mp4" && file.type !== "audio/x-m4a" &&
        !file.name.toLowerCase().endsWith(".mp3") && !file.name.toLowerCase().endsWith(".m4a")) {
      showError(trackId, "仅支持 mp3、m4a 格式");
      return;
    }
    // 累计大小校验：两首合计不超过 10MB
    const otherTrack = customAudio.find(a => a.trackId !== trackId);
    const otherSize = otherTrack?.dataUrl ? (otherTrack.dataUrl.length * 3) / 4 : 0;
    if (otherSize + file.size > 10 * 1024 * 1024) {
      showError(trackId, "两首音乐合计超过 10MB 限制");
      return;
    }

    setUploading(prev => ({ ...prev, [trackId]: true }));
    stopPreview();

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      // 先尝试上传到 R2，失败则仅保留 dataUrl（本地预览仍可用）
      let audioKey: string | undefined;
      try {
        audioKey = await uploadAudioToR2(dataUrl);
      } catch {
        // 上传失败时保留 dataUrl，分享时会在 prepareMedia 重试
      }

      const newTrack: CustomAudioTrack = {
        trackId,
        dataUrl,
        audioKey,
        fileName: file.name,
      };

      const filtered = customAudio.filter(a => a.trackId !== trackId);
      onChange([...filtered, newTrack]);
    } catch {
      showError(trackId, "上传失败，请重试");
    } finally {
      setUploading(prev => ({ ...prev, [trackId]: false }));
    }
  };

  // 恢复默认
  const handleRestore = (trackId: "birthday" | "gift") => {
    stopPreview();
    onChange(customAudio.filter(a => a.trackId !== trackId));
  };

  // 重新上传：清除旧 key，触发 file input
  const handleReupload = (trackId: "birthday" | "gift") => {
    stopPreview();
    onChange(customAudio.filter(a => a.trackId !== trackId));
    setTimeout(() => fileInputRefs.current[trackId]?.click(), 50);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* 标题区 */}
      <div className="text-center">
        <p className="tracking-[0.3em] text-white/45 mb-4" style={{ fontSize: "clamp(0.82rem, 1.6vw, 1rem)" }}>
          STEP 06
        </p>
        <h2 className="font-extralight tracking-wide text-white/92" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>
          选择背景音乐
        </h2>
        <p className="text-white/45 mt-2 tracking-wider" style={{ fontSize: "clamp(0.75rem, 1.3vw, 0.9rem)" }}>
          可选 · 替换默认音乐为你们的歌
        </p>
        <p className="text-xs mt-1 tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>
          支持 mp3、m4a · 一共不超过 10MB · 跳过则使用默认音乐
        </p>
      </div>

      {/* 曲目列表 */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {TRACKS.map(({ trackId, name, scene, src: defaultSrc }) => {
          const track = getTrack(trackId);
          const isUploading = uploading[trackId];
          const error = errors[trackId];
          const isPlaying = playingId === trackId;
          const hasCustom = !!track;

          return (
            <div key={trackId} className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col gap-3">
              {/* 曲目信息行 */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm tracking-wide truncate">{name}</p>
                  <p className="text-xs mt-0.5 tracking-wider truncate" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {hasCustom ? (track.fileName ?? "已替换") : scene}
                  </p>
                </div>
                {/* 试听按钮 */}
                <button
                  onClick={() => handleTogglePreview(trackId, defaultSrc)}
                  disabled={isUploading}
                  className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 transition-colors disabled:opacity-30"
                  title={isPlaying ? "停止试听" : "试听"}
                >
                  {isPlaying ? (
                    // 暂停图标
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="3" y="2" width="4" height="12" rx="1"/>
                      <rect x="9" y="2" width="4" height="12" rx="1"/>
                    </svg>
                  ) : (
                    // 播放图标
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4 2.5l10 5.5-10 5.5V2.5z"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* 错误提示 */}
              {error && (
                <p className="text-xs tracking-wider" style={{ color: "rgba(255,120,80,0.9)" }}>{error}</p>
              )}

              {/* 操作区 */}
              {isUploading ? (
                <p className="text-xs tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>上传中…</p>
              ) : hasCustom ? (
                // 已替换状态
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestore(trackId)}
                    className="flex-1 min-h-[44px] text-xs tracking-wider rounded-lg border border-white/15 text-white/40 hover:text-white/60 hover:border-white/25 transition-colors"
                  >
                    恢复默认
                  </button>
                  <button
                    onClick={() => handleReupload(trackId)}
                    className="flex-1 min-h-[44px] text-xs tracking-wider rounded-lg border border-dashed border-white/15 text-white/40 hover:text-white/60 hover:border-white/30 transition-colors"
                  >
                    重新上传
                  </button>
                  <input
                    ref={el => { fileInputRefs.current[trackId] = el; }}
                    type="file"
                    accept=".mp3,.m4a,audio/mpeg,audio/mp4,audio/x-m4a"
                    className="hidden"
                    onChange={e => handleFileChange(trackId, e)}
                  />
                </div>
              ) : (
                // 默认状态 — 上传替换
                <label className="bg-white/3 border border-dashed border-white/15 rounded-lg cursor-pointer hover:border-white/30 transition-colors flex items-center justify-center min-h-[44px]">
                  <input
                    ref={el => { fileInputRefs.current[trackId] = el; }}
                    type="file"
                    accept=".mp3,.m4a,audio/mpeg,audio/mp4,audio/x-m4a"
                    className="hidden"
                    onChange={e => handleFileChange(trackId, e)}
                  />
                  <span className="text-xs tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
                    + 上传替换
                  </span>
                </label>
              )}
            </div>
          );
        })}
      </div>

      {/* 版权免责 */}
      <p className="text-xs text-center max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.25)" }}>
        请上传您拥有合法使用权的音乐，因版权问题产生的纠纷由上传者自行承担。
      </p>

      {/* 底部按钮 */}
      <div className="flex gap-4">
        <SpringButton variant="secondary" onClick={handleBack}>返回</SpringButton>
        <SpringButton variant="primary" onClick={handleNext}>
          {customAudio.length === 0 ? "跳过" : "下一步"}
        </SpringButton>
      </div>

      {showGoToStep && onGoToStep && (
        <GoToStepBar currentStep={6} onGoToStep={handleGoToStep} />
      )}
    </div>
  );
}
