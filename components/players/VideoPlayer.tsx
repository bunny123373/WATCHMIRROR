"use client";

import { useState } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const [hasStarted, setHasStarted] = useState(false);

  const isMuxUrl = (url: string) => {
    return url.includes('mux.com') || url.includes('stream.mux.com') || url.includes('mux.net');
  };

  const getMuxPlaybackId = (url: string) => {
    const patterns = [
      /mux\.com\/([^\/?]+)/,
      /stream\.mux\.com\/([^\/?]+)/,
      /mux\.net\/([^\/?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1].replace('.m3u8', '').replace('/highest', '').replace('/lowest', '');
      }
    }
    return null;
  };

  const isMux = isMuxUrl(src);
  const playbackId = getMuxPlaybackId(src);

  const muxEmbedUrl = playbackId 
    ? `https://player.mux.com/${playbackId}?autoplay=1&muted=0&metadata-video-title=Video`
    : null;

  return (
    <div className="relative w-full">
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
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition transform hover:scale-105">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        ) : (
          isMux && muxEmbedUrl ? (
            <iframe
              src={muxEmbedUrl}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <video
              src={src}
              poster={poster}
              controls
              playsInline
              autoPlay
              className="absolute inset-0 w-full h-full object-contain"
            />
          )
        )}
      </div>
    </div>
  );
}
