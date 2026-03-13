"use client";

import MuxPlayer from "@mux/mux-player-react";
import { useState } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const [hasStarted, setHasStarted] = useState(false);

  const getMuxPlaybackId = (url: string) => {
    const patterns = [
      /mux\.com\/([^\/?]+)/,
      /stream\.mux\.com\/([^\/?]+)\//,
      /mux\.net\/([^\/?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const isMuxUrl = (url: string) => {
    return url.includes('mux.com') || url.includes('stream.mux.com') || url.includes('mux.net');
  };

  const playbackId = getMuxPlaybackId(src);
  const isMux = isMuxUrl(src);

  return (
    <div 
      className="relative w-full overflow-hidden rounded-lg bg-black sm:rounded-xl"
      style={{ 
        aspectRatio: '16/9',
        maxHeight: '70vh',
        minHeight: '200px'
      }}
    >
      {!hasStarted ? (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10 bg-black"
          onClick={() => setHasStarted(true)}
        >
          {poster && (
            <img 
              src={poster} 
              alt="Poster" 
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
          )}
          <div className="relative w-24 h-24 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition transform hover:scale-105">
            <svg className="w-12 h-12 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      ) : (
        isMux && playbackId ? (
          <MuxPlayer
            playbackId={playbackId}
            metadata={{
              video_title: 'Video',
            }}
            streamType="on-demand"
            playsInline
            autoPlay
            className="w-full h-full"
            accentColor="#E50914"
          />
        ) : (
          <video
            src={src}
            poster={poster}
            controls
            playsInline
            autoPlay
            className="w-full h-full"
          />
        )
      )}
    </div>
  );
}
