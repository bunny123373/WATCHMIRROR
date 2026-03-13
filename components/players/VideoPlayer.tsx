"use client";

import { createPlayer, Poster } from "@videojs/react";
import { VideoSkin, Video, videoFeatures } from "@videojs/react/video";
import "@videojs/react/video/skin.css";
import { useRef, useEffect, useState } from "react";

const Player = createPlayer({ features: videoFeatures });

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTap = () => {
      if (!hasStarted) {
        setHasStarted(true);
      }
      
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
  }, [hasStarted]);

  return (
    <div ref={containerRef}>
      <Player.Provider>
        <VideoSkin>
          <Video src={src} playsInline={false} autoPlay={hasStarted} />
          {poster && <Poster src={poster} />}
        </VideoSkin>
      </Player.Provider>
    </div>
  );
}
