"use client";

import { useState } from "react";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <div className="w-full bg-black">
      <div 
        className="relative w-full"
        style={{ aspectRatio: '16/9' }}
      >
        {!hasStarted ? (
          <div 
            className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black z-10"
            onClick={() => setHasStarted(true)}
          >
            {poster && (
              <img 
                src={poster} 
                alt="Poster" 
                className="absolute inset-0 h-full w-full object-cover opacity-50"
              />
            )}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/90 sm:h-16 sm:w-16 md:h-20 md:w-20">
              <svg className="h-8 w-8 text-black sm:h-10 sm:w-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        ) : (
          <MediaPlayer 
            src={src}
            poster={poster}
            title="Video"
            autoPlay
            className="w-full h-full"
          >
            <MediaProvider />
            <DefaultVideoLayout icons={defaultLayoutIcons} />
          </MediaPlayer>
        )}
      </div>
    </div>
  );
}
