"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export function useWatchHistory(contentSlug: string) {
  const { user } = useAuth();
  const savedRef = useRef(false);

  useEffect(() => {
    if (!user || savedRef.current) return;

    const saveProgress = async () => {
      savedRef.current = true;
      const video = document.querySelector("video");
      if (!video) return;

      const save = async () => {
        const currentTime = video.currentTime;
        const duration = video.duration;
        
        if (!currentTime || !duration || duration <= 0) return;

        await fetch("/api/watch-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentId: contentSlug,
            progress: currentTime,
            duration
          })
        });
      };

      const interval = setInterval(saveProgress, 30000);
      
      video.addEventListener("pause", saveProgress);
      video.addEventListener("ended", saveProgress);
      video.addEventListener("beforeunload", saveProgress);

      return () => {
        clearInterval(interval);
        video.removeEventListener("pause", saveProgress);
        video.removeEventListener("ended", saveProgress);
        video.removeEventListener("beforeunload", saveProgress);
        saveProgress();
      };
    };

    const video = document.querySelector("video");
    if (video) {
      saveProgress();
    } else {
      const observer = new MutationObserver(() => {
        const v = document.querySelector("video");
        if (v) {
          observer.disconnect();
          saveProgress();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, [user, contentSlug]);
}
