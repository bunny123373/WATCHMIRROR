"use client";

import { RefObject, useEffect, useMemo, useRef } from "react";
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
  const resumeItem = useAppSelector((state) =>
    state.continue.items.find(
      (item) => item.slug === base.slug && item.seasonNumber === base.seasonNumber && item.episodeNumber === base.episodeNumber
    )
  );
  const items = useAppSelector((state) => state.continue.items);
  const restoredKeyRef = useRef<string | null>(null);
  const contentKey = `${base.slug}:${base.seasonNumber ?? 0}:${base.episodeNumber ?? 0}`;
  const payloadBase = useMemo(
    () => ({
      slug: base.slug,
      type: base.type,
      title: base.title,
      poster: base.poster,
      seasonNumber: base.seasonNumber,
      episodeNumber: base.episodeNumber
    }),
    [base.slug, base.type, base.title, base.poster, base.seasonNumber, base.episodeNumber]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const savedTime = resumeItem?.currentTime ?? 0;
    if (savedTime <= 30 || restoredKeyRef.current === contentKey) return;

    const restore = () => {
      if (restoredKeyRef.current === contentKey) return;
      if (video.currentTime > 1) {
        restoredKeyRef.current = contentKey;
        return;
      }
      video.currentTime = savedTime;
      restoredKeyRef.current = contentKey;
    };

    if (video.readyState >= 1) {
      restore();
    }

    video.addEventListener("loadedmetadata", restore);
    return () => video.removeEventListener("loadedmetadata", restore);
  }, [videoRef, resumeItem?.currentTime, contentKey]);

  useEffect(() => {
    restoredKeyRef.current = null;
  }, [contentKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const timer = window.setInterval(() => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const currentTime = video.currentTime || 0;
      if (currentTime < 30 || duration <= 0) return;

      const progress = currentTime / duration;

      if (progress >= 0.9) {
        dispatch(
          removeContinue({
            slug: payloadBase.slug,
            seasonNumber: payloadBase.seasonNumber,
            episodeNumber: payloadBase.episodeNumber
          })
        );
        return;
      }

      dispatch(
        upsertContinue({
          ...payloadBase,
          currentTime,
          duration,
          updatedAt: new Date().toISOString()
        })
      );
    }, 5000);

    return () => window.clearInterval(timer);
  }, [
    videoRef,
    dispatch,
    payloadBase.slug,
    payloadBase.type,
    payloadBase.title,
    payloadBase.poster,
    payloadBase.seasonNumber,
    payloadBase.episodeNumber
  ]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);
}
