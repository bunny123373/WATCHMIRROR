"use client";

import { createPlayer } from "@videojs/react";
import { Video, MinimalVideoSkin, videoFeatures } from "@videojs/react/video";
import "@videojs/react/video/skin.css";
import { useState } from "react";

const Player = createPlayer({ features: videoFeatures });

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <div 
      className="relative w-full overflow-hidden rounded-lg bg-black sm:rounded-xl"
      style={{ 
        aspectRatio: '16/9',
        maxHeight: '70vh',
        minHeight: '200px'
      }}
      onClick={() => !hasStarted && setHasStarted(true)}
    >
      <div className="absolute inset-0">
        <Player.Provider>
          <MinimalVideoSkin>
            <Video 
              src={hasStarted ? src : undefined} 
              poster={poster}
              playsInline
              autoPlay={hasStarted}
              className="!w-full !h-full"
            />
          </MinimalVideoSkin>
        </Player.Provider>
      </div>
    </div>
  );
}
