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
