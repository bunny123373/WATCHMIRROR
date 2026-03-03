"use client";

import { RefObject, useEffect } from "react";
import { ContinueWatchingItem } from "@/types/content";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeContinue, upsertContinue } from "@/store/slices/continueSlice";

const STORAGE_KEY = "watchmirror_continue_watching";

interface TrackInput {
  videoRef: RefObject<HTMLVideoElement | null>;
  base: Omit<ContinueWatchingItem, "currentTime" | "duration" | "updatedAt">;
}

export function usePlaybackTracker({ videoRef, base }: TrackInput) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.continue.items);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const saved = items.find(
      (item) => item.slug === base.slug && item.seasonNumber === base.seasonNumber && item.episodeNumber === base.episodeNumber
    );

    if (saved && saved.currentTime > 30) {
      video.currentTime = saved.currentTime;
    }
  }, [videoRef, items, base.slug, base.seasonNumber, base.episodeNumber]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const timer = window.setInterval(() => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const currentTime = video.currentTime || 0;
      if (currentTime < 30 || duration <= 0) return;

      const progress = currentTime / duration;

      if (progress >= 0.9) {
        dispatch(removeContinue({ slug: base.slug, seasonNumber: base.seasonNumber, episodeNumber: base.episodeNumber }));
        return;
      }

      dispatch(
        upsertContinue({
          ...base,
          currentTime,
          duration,
          updatedAt: new Date().toISOString()
        })
      );
    }, 5000);

    return () => window.clearInterval(timer);
  }, [videoRef, dispatch, base]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);
}