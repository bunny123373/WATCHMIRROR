"use client";

import { createPlayer } from "@videojs/react";
import { Video, videoFeatures } from "@videojs/react/video";
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
    <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-black">
      <Player.Provider>
        <Video 
          src={hasStarted ? src : undefined} 
          poster={poster}
          playsInline 
          autoPlay={hasStarted}
          className="w-full h-full video-js"
        />
      </Player.Provider>
    </div>
  );
}
