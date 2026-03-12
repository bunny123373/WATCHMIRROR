"use client";

import { createPlayer } from "@videojs/react";
import { VideoSkin, Video, videoFeatures } from "@videojs/react/video";
import "@videojs/react/video/skin.css";
import { useRef, useEffect } from "react";

const Player = createPlayer({ features: videoFeatures });

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTap = () => {
      const videoEl = container.querySelector("video");
      if (!videoEl) return;

      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
        const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
        if (orientation && typeof orientation.lock === "function") {
          orientation.lock("landscape").catch(() => {});
        }
      }
    };

    container.addEventListener("click", handleTap);
    container.addEventListener("touchend", handleTap);

    return () => {
      container.removeEventListener("click", handleTap);
      container.removeEventListener("touchend", handleTap);
    };
  }, []);

  return (
    <div ref={containerRef}>
      <Player.Provider>
        <VideoSkin>
          <Video src={src} playsInline />
        </VideoSkin>
      </Player.Provider>
    </div>
  );
}
