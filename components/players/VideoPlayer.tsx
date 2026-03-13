"use client";

import { createPlayer } from "@videojs/react";
import { Video, VideoSkin, videoFeatures } from "@videojs/react/video";
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
      <Player.Provider>
        <VideoSkin>
          <Video 
            src={hasStarted ? src : undefined} 
            poster={poster}
            playsInline
            autoPlay={hasStarted}
            className="w-full h-full"
          />
        </VideoSkin>
      </Player.Provider>
      
      {!hasStarted && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          onClick={() => setHasStarted(true)}
        >
          <div className="w-24 h-24 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition transform hover:scale-105">
            <svg className="w-12 h-12 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
