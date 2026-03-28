"use client";
import { useRef, useCallback } from "react";

export function useAudioPlayer(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playingRef = useRef(false);
  const unlockedRef = useRef(false);
  const targetVolRef = useRef(0.65); // 记住目标音量，fadeOut 后 fadeIn 可恢复

  const getAudio = useCallback(() => {
    if (!audioRef.current && typeof window !== "undefined") {
      audioRef.current = new Audio(src);
      audioRef.current.loop = true;
      audioRef.current.volume = 0;
      // 监听意外暂停（如系统调整音量触发的浏览器 pause 事件）
      // 如果 playingRef 仍为 true，说明不是我们主动暂停的，尝试恢复
      // 移动端音量键会触发 pause，直接 play() 可能被 autoplay policy 拒绝
      // 用 volume=0 + play() + 渐入的方式绕过限制
      audioRef.current.addEventListener("pause", () => {
        if (!playingRef.current) return;
        const audio = audioRef.current;
        if (!audio) return;
        window.setTimeout(() => {
          if (!playingRef.current || !audio.paused) return;
          const target = targetVolRef.current;
          audio.volume = 0;
          audio.play().then(() => {
            // 渐入恢复，避免音量突变
            const timer = setInterval(() => {
              if (audio.volume < target - 0.001) {
                audio.volume = Math.min(target, parseFloat((audio.volume + 0.04).toFixed(3)));
              } else {
                try { audio.volume = target; } catch { /* ignore */ }
                clearInterval(timer);
              }
            }, 80);
          }).catch(() => {});
        }, 300);
      });
    }
    return audioRef.current;
  }, [src]);

  const clearFade = useCallback(() => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  // 移动端首次用户手势时调用，静默 play/pause 解锁 iOS 音频限制
  const unlock = useCallback(() => {
    if (unlockedRef.current) return;
    if (typeof window === "undefined") return;
    const audio = getAudio();
    if (!audio) return;
    unlockedRef.current = true;
    // play 再立即 pause，解锁 AudioContext；同时保证 currentTime 归零
    const prevMuted = audio.muted;
    const prevVolume = audio.volume;
    audio.muted = true;
    audio.volume = 0;
    const p = audio.play();
    if (p) {
      p.then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = prevMuted;
        audio.volume = prevVolume;
      }).catch(() => {});
    }
  }, [getAudio]);

  const fadeIn = useCallback((targetVolume = 0.65, onBlocked?: () => void) => {
    const audio = getAudio();
    if (!audio) return;
    targetVolRef.current = targetVolume;
    clearFade();
    // 从头播放
    if (audio.currentTime > 0 && !playingRef.current) {
      audio.currentTime = 0;
    }
    const p = audio.play();
    if (p) {
      p.then(() => {
        playingRef.current = true;
        fadeTimerRef.current = setInterval(() => {
          if (audio.volume < targetVolume - 0.001) {
            // 步长加大，iOS 上小步长有时被忽略
            audio.volume = Math.min(targetVolume, parseFloat((audio.volume + 0.04).toFixed(3)));
          } else {
            try { audio.volume = targetVolume; } catch { /* ignore */ }
            clearFade();
          }
        }, 80);
      }).catch(() => {
        onBlocked?.();
      });
    } else {
      // 老版本浏览器 play() 无返回值
      playingRef.current = true;
    }
  }, [getAudio, clearFade]);

  const playMuted = useCallback((onBlocked?: () => void) => {
    const audio = getAudio();
    if (!audio) return;
    clearFade();
    targetVolRef.current = Math.max(targetVolRef.current, 0.65);
    audio.volume = 0;
    if (audio.currentTime > 0 && !playingRef.current) {
      audio.currentTime = 0;
    }
    const p = audio.play();
    if (p) {
      p.then(() => {
        playingRef.current = true;
      }).catch(() => {
        onBlocked?.();
      });
    } else {
      playingRef.current = true;
    }
  }, [getAudio, clearFade]);

  const fadeOut = useCallback((onDone?: () => void) => {
    const audio = getAudio();
    if (!audio) return;
    playingRef.current = false;
    clearFade();
    // 步长加大（0.06），避免 iOS 精度问题导致 interval 永远不结束
    fadeTimerRef.current = setInterval(() => {
      const next = parseFloat((audio.volume - 0.06).toFixed(3));
      if (next > 0.01) {
        try { audio.volume = next; } catch { /* ignore */ }
      } else {
        try { audio.volume = 0; } catch { /* ignore */ }
        audio.pause();
        clearFade();
        onDone?.();
      }
    }, 80);
  }, [getAudio, clearFade]);

  const stop = useCallback(() => {
    const audio = getAudio();
    if (!audio) return;
    playingRef.current = false;
    clearFade();
    try { audio.volume = 0; } catch { /* ignore */ }
    audio.pause();
    audio.currentTime = 0;
  }, [getAudio, clearFade]);

  const toggle = useCallback(() => {
    if (playingRef.current) {
      fadeOut();
    } else {
      fadeIn(targetVolRef.current);
    }
  }, [fadeIn, fadeOut]);

  const refreshAfterInterruption = useCallback((targetVolume = targetVolRef.current) => {
    const audio = getAudio();
    if (!audio) return;
    const currentTime = audio.currentTime;
    clearFade();
    try { audio.pause(); } catch { /* ignore */ }
    try { audio.currentTime = currentTime; } catch { /* ignore */ }
    try { audio.volume = 0; } catch { /* ignore */ }
    const p = audio.play();
    if (p) {
      p.then(() => {
        playingRef.current = true;
        fadeTimerRef.current = setInterval(() => {
          if (audio.volume < targetVolume - 0.001) {
            audio.volume = Math.min(targetVolume, parseFloat((audio.volume + 0.06).toFixed(3)));
          } else {
            try { audio.volume = targetVolume; } catch { /* ignore */ }
            clearFade();
          }
        }, 70);
      }).catch(() => {});
    }
  }, [getAudio, clearFade]);

  const isPlaying = () => playingRef.current;

  return { fadeIn, fadeOut, stop, toggle, isPlaying, unlock, playMuted, refreshAfterInterruption };
}
