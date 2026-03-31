"use client";

import { useEffect, useId, useRef } from "react";

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
  const playerId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const destroyPlayer = () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy?.();
        } catch {}
        playerRef.current = null;
      }
    };

    const initPlayer = () => {
      if (cancelled) return;

      if (!window.Playerjs) {
        retryTimeout = setTimeout(initPlayer, 250);
        return;
      }

      destroyPlayer();

      playerRef.current = new window.Playerjs({
        id: playerId,
        file: src,
        poster,
        title,
        subtitle,
        autoplay: autoplay ? 1 : 0,
        start,
        end
      });
    };

    initPlayer();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      destroyPlayer();
    };
  }, [playerId, src, poster, title, subtitle, autoplay, start, end]);

  return (
    <div 
      id={playerId}
      ref={containerRef} 
      className="playerjs-container w-full h-full"
      style={{ aspectRatio: '16/9' }}
    />
  );
}
