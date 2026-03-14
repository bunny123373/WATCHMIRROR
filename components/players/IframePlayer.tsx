"use client";

import { useState } from "react";

interface IframePlayerProps {
  src: string;
}

export default function IframePlayer({ src }: IframePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="w-full bg-black">
      <div 
        className="relative w-full"
        style={{ aspectRatio: '16/9' }}
      >
        {!isPlaying ? (
          <div 
            className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black"
            onClick={() => setIsPlaying(true)}
          >
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/90 sm:h-16 sm:w-16 md:h-20 md:w-20">
              <svg className="h-8 w-8 text-black sm:h-10 sm:w-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        ) : (
          <iframe
            src={src}
            allowFullScreen
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          />
        )}
      </div>
    </div>
  );
}
