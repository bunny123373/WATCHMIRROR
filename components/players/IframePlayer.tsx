"use client";

import { useEffect, useRef, useState } from "react";
import { X, Minimize2, Maximize2, AlertCircle, RefreshCw } from "lucide-react";

interface IframePlayerProps {
  src: string;
}

export default function IframePlayer({ src }: IframePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full bg-black">
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#181818]">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="mt-2 text-sm text-gray-400">Failed to load player</p>
            <button
              onClick={() => { setHasError(false); setIsLoaded(false); }}
              className="mt-3 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : !isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#181818]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : null}
        <iframe
          src={src}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
          title="Video Player"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      </div>
      
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 md:bottom-6 md:right-6"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>
    </div>
  );
}
