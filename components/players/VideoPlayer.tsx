"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

type PlayerType = "native" | "vidstack" | "mux";

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [playerType, setPlayerType] = useState<PlayerType>("native");
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const isHLS = src?.includes('.m3u8') || src?.includes('mux.com') || src?.includes('stream.mux');
  const isMux = src?.includes('mux.com') || src?.includes('stream.mux') || src?.includes('mux.net');

  const getMuxPlaybackId = (url: string) => {
    const patterns = [
      /player\.mux\.com\/([^\/?]+)/,
      /mux\.com\/([^\/?]+)/,
      /stream\.mux\.com\/([^\/?]+)/,
      /mux\.net\/([^\/?]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1].replace('.m3u8', '').replace('/highest', '').replace('/lowest', '').split('?')[0];
      }
    }
    return null;
  };

  const playbackId = getMuxPlaybackId(src);
  const muxEmbedUrl = playbackId ? `https://player.mux.com/${playbackId}?autoplay=1&muted=0` : null;

  useEffect(() => {
    if (!hasStarted || playerType !== "native" || !videoRef.current) return;

    if (isHLS && Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy();
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => videoRef.current?.play());
      hlsRef.current = hls;
    } else if (videoRef.current) {
      videoRef.current.src = src;
      videoRef.current.play();
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [hasStarted, src, isHLS, playerType]);

  const PlayerButton = ({ type, label }: { type: PlayerType; label: string }) => (
    <button
      onClick={() => setPlayerType(type)}
      className={`px-3 py-1.5 rounded text-xs font-medium transition ${
        playerType === type 
          ? "bg-red-600 text-white" 
          : "bg-white/10 text-gray-300 hover:bg-white/20"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full bg-black">
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        {!hasStarted ? (
          <div 
            className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black z-10"
            onClick={() => setHasStarted(true)}
          >
            {poster && (
              <img src={poster} alt="Poster" className="absolute inset-0 h-full w-full object-cover opacity-50" />
            )}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/90 sm:h-16 sm:w-16 md:h-20 md:w-20">
              <svg className="h-8 w-8 text-black sm:h-10 sm:w-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        ) : (
          <>
            {/* Player Selection Buttons */}
            <div className="absolute top-2 right-2 z-20 flex gap-1">
              <PlayerButton type="native" label="Native" />
              {isMux && <PlayerButton type="mux" label="Mux" />}
              {!isHLS && <PlayerButton type="vidstack" label="Vidstack" />}
            </div>

            {/* Native Player with HLS */}
            {playerType === "native" && (
              <video
                ref={videoRef}
                poster={poster}
                controls
                playsInline
                className="h-full w-full"
              />
            )}

            {/* Mux Player */}
            {playerType === "mux" && muxEmbedUrl && (
              <iframe
                src={muxEmbedUrl}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full border-0"
              />
            )}

            {/* Vidstack Player */}
            {playerType === "vidstack" && !isHLS && (
              <div className="h-full w-full">
                <video
                  src={src}
                  poster={poster}
                  controls
                  playsInline
                  autoPlay
                  className="h-full w-full"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
