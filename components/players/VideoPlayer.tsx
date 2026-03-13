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
      className="relative w-full aspect-video overflow-hidden rounded-xl bg-black"
      onClick={() => !hasStarted && setHasStarted(true)}
    >
      <Player.Provider>
        <MinimalVideoSkin>
          <Video 
            src={hasStarted ? src : undefined} 
            poster={poster}
            playsInline
            autoPlay={hasStarted}
          />
        </MinimalVideoSkin>
      </Player.Provider>
    </div>
  );
}
