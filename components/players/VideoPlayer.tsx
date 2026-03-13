"use client";

import { createPlayer, Poster } from "@videojs/react";
import { VideoSkin, Video, videoFeatures } from "@videojs/react/video";
import "@videojs/react/video/skin.css";
import { useRef, useEffect, useState, useCallback } from "react";

const Player = createPlayer({ features: videoFeatures });

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const handleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!hasStarted) {
      setHasStarted(true);
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        if (screen.orientation && (screen.orientation as ScreenOrientation & { unlock?: () => void }).unlock) {
          (screen.orientation as ScreenOrientation & { unlock?: () => void }).unlock?.();
        }
      } else {
        const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
        if (orientation && typeof orientation.lock === "function") {
          await orientation.lock("landscape").catch(() => {});
        }
        await container.requestFullscreen();
      }
    } catch (e) {
      console.error("Fullscreen error:", e);
    }
  }, [hasStarted]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("click", handleFullscreen);
    container.addEventListener("touchend", handleFullscreen);

    return () => {
      container.removeEventListener("click", handleFullscreen);
      container.removeEventListener("touchend", handleFullscreen);
    };
  }, [handleFullscreen]);

  useEffect(() => {
    const handleChange = () => {
      if (!document.fullscreenElement) {
        const orientation = screen.orientation as ScreenOrientation & { unlock?: () => void };
        if (orientation && typeof orientation.unlock === "function") {
          orientation.unlock?.();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-video overflow-hidden rounded-xl"
      style={{ maxHeight: '70vh' }}
    >
      <Player.Provider>
        <VideoSkin>
          <Video src={src} playsInline={false} autoPlay={hasStarted} className="w-full h-full" />
          {poster && <Poster src={poster} className="w-full h-full object-cover" />}
        </VideoSkin>
      </Player.Provider>
    </div>
  );
}
