"use client";

import { useState } from "react";

interface IframePlayerProps {
  src: string;
}

export default function IframePlayer({ src }: IframePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  let safeSrc = "";
  try {
    const parsed = new URL(src);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      safeSrc = parsed.toString();
    }
  } catch {
    safeSrc = "";
  }

  if (!safeSrc) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted">
        Invalid streaming URL
      </div>
    );
  }

  return (
    <div 
      className="relative w-full overflow-hidden rounded-lg bg-black sm:rounded-xl"
      style={{ aspectRatio: '16/9', maxHeight: '70vh', minHeight: '200px' }}
    >
      {!isPlaying ? (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10 bg-black"
          onClick={() => setIsPlaying(true)}
        >
          <div className="w-24 h-24 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition transform hover:scale-105">
            <svg className="w-12 h-12 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      ) : (
        <iframe
          src={safeSrc}
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  );
}
