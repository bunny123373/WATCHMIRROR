"use client";

import { useEffect, useRef } from "react";

interface PlayerjsPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  autoplay?: boolean;
  start?: number;
  end?: number;
}

declare global {
  interface Window {
    Playerjs: new (config: PlayerjsConfig) => any;
  }
}

interface PlayerjsConfig {
  id: string;
  file?: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  autoplay?: number;
  start?: number;
  end?: number;
  duration?: number;
}

export default function PlayerjsPlayer({ 
  src, 
  poster, 
  title, 
  subtitle,
  autoplay = false,
  start,
  end
}: PlayerjsPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !window.Playerjs) return;

    const playerId = `playerjs-${Date.now()}`;
    
    playerRef.current = new window.Playerjs({
      id: playerId,
      file: src,
      poster: poster,
      title: title,
      subtitle: subtitle,
      autoplay: autoplay ? 1 : 0,
      start: start,
      end: end
    });

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy?.();
        } catch (e) {}
      }
    };
  }, [src, poster, title, subtitle, autoplay, start, end]);

  return (
    <div 
      ref={containerRef} 
      className="playerjs-container w-full h-full"
      style={{ aspectRatio: '16/9' }}
    />
  );
}
