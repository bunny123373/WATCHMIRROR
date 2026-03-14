"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

type PlayerType = "native" | "vidstack" | "mux";

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const [playerType, setPlayerType] = useState<PlayerType>("native");
  const [showDropdown, setShowDropdown] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const vidstackRef = useRef<any>(null);

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
    if (playerType !== "native" || !videoRef.current) return;

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
  }, [src, isHLS, playerType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const playerOptions = [
    { type: "native" as PlayerType, label: "Native", available: true },
    { type: "mux" as PlayerType, label: "Mux", available: isMux },
    { type: "vidstack" as PlayerType, label: "Vidstack", available: !isHLS },
  ].filter(opt => opt.available);

  return (
    <div className="w-full bg-black">
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        {/* Player Dropdown */}
        <div ref={dropdownRef} className="absolute top-2 right-2 z-20">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 rounded bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
          >
            <span>{playerType.charAt(0).toUpperCase() + playerType.slice(1)}</span>
            <svg className={`h-3 w-3 transition ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-28 rounded bg-[#1a1a1a] border border-white/10 py-1 shadow-lg">
              {playerOptions.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => { setPlayerType(opt.type); setShowDropdown(false); }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-white/10 ${
                    playerType === opt.type ? 'text-red-500' : 'text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
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
          <MediaPlayer
            ref={vidstackRef}
            src={src}
            poster={poster}
            autoplay
            className="h-full w-full"
          >
            <MediaProvider />
            <DefaultVideoLayout thumbnails={poster} icons={defaultLayoutIcons} />
          </MediaPlayer>
        )}
      </div>
    </div>
  );
}
