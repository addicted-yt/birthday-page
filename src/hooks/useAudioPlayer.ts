"use client";
import { useRef, useCallback } from "react";

export function useAudioPlayer(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playingRef = useRef(false);

  const getAudio = useCallback(() => {
    if (!audioRef.current && typeof window !== "undefined") {
      audioRef.current = new Audio(src);
      audioRef.current.loop = true;
      audioRef.current.volume = 0;
    }
    return audioRef.current;
  }, [src]);

  const clearFade = useCallback(() => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const fadeIn = useCallback((targetVolume = 0.65, onBlocked?: () => void) => {
    const audio = getAudio();
    if (!audio) return;
    audio.play().catch(() => {
      onBlocked?.();
    });
    playingRef.current = true;
    clearFade();
    fadeTimerRef.current = setInterval(() => {
      if (audio.volume < targetVolume) {
        audio.volume = Math.min(targetVolume, audio.volume + 0.025);
      } else {
        clearFade();
      }
    }, 60);
  }, [getAudio, clearFade]);

  const fadeOut = useCallback((onDone?: () => void) => {
    const audio = getAudio();
    if (!audio) return;
    playingRef.current = false;
    clearFade();
    fadeTimerRef.current = setInterval(() => {
      if (audio.volume > 0.02) {
        audio.volume = Math.max(0, audio.volume - 0.018);
      } else {
        audio.volume = 0;
        audio.pause();
        clearFade();
        onDone?.();
      }
    }, 80);
  }, [getAudio, clearFade]);

  const toggle = useCallback(() => {
    if (playingRef.current) {
      fadeOut();
    } else {
      fadeIn();
    }
  }, [fadeIn, fadeOut]);

  const isPlaying = () => playingRef.current;

  return { fadeIn, fadeOut, toggle, isPlaying };
}
