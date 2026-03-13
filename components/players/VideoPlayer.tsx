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
              onPlay={() => setHasStarted(true)}
            />
          </MinimalVideoSkin>
        </Player.Provider>
      </div>
      
      {!hasStarted && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          onClick={() => setHasStarted(true)}
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition">
            <svg className="w-10 h-10 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
