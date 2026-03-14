"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const isHLS = src?.includes('.m3u8') || src?.includes('m3u8');

  useEffect(() => {
    if (!hasStarted || !videoRef.current) return;

    if (isHLS && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play();
      });
      hlsRef.current = hls;
    } else if (videoRef.current) {
      videoRef.current.src = src;
      videoRef.current.play();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hasStarted, src, isHLS]);

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
          <video
            ref={videoRef}
            poster={poster}
            controls
            playsInline
            className="h-full w-full"
          />
        )}
      </div>
    </div>
  );
}
