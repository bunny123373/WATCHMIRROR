"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { MediaPlayer, MediaProvider, Poster, useAudioOptions } from "@vidstack/react";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import PlayerjsPlayer from "./PlayerjsPlayer";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  introStart?: number;
  introEnd?: number;
  outroStart?: number;
}

type PlayerType = "native" | "vidstack" | "mux" | "webcomponent" | "playerjs";

function AudioTrackSelectorVidstack() {
  const audioOptions = useAudioOptions();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTrack = audioOptions?.find((opt: any) => opt.selected);
  const label = currentTrack?.label || "Audio";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!audioOptions || audioOptions.length <= 1) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
        <span>{label}</span>
        <svg className={`h-3 w-3 transition ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-1 w-36 rounded bg-[#1a1a1a] border border-white/10 py-1 shadow-lg">
          {audioOptions.map((opt: any, index: number) => (
            <button
              key={index}
              onClick={() => { opt.select(); setIsOpen(false); }}
              className={`w-full px-3 py-2 text-left text-xs hover:bg-white/10 ${
                opt.selected ? 'text-red-500' : 'text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NativeAudioSelector({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [audioTracks, setAudioTracks] = useState<{ id: number; label: string; enabled: boolean }[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTracks = () => {
      if (!videoRef.current) return;
      const video = videoRef.current as HTMLVideoElement & { audioTracks?: any };
      const tracks = video.audioTracks;
      if (tracks && tracks.length > 0) {
        const trackList = Array.from(tracks).map((track: any, index: number) => ({
          id: index,
          label: track.label || track.language || `Audio ${index + 1}`,
          enabled: track.enabled
        }));
        setAudioTracks(trackList);
      }
    };

    const timeout = setTimeout(updateTracks, 1500);
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', updateTracks);
    }
    return () => {
      clearTimeout(timeout);
      if (video) {
        video.removeEventListener('loadedmetadata', updateTracks);
      }
    };
  }, [videoRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const enabledTrack = audioTracks.find(t => t.enabled);
  const currentLabel = enabledTrack?.label || "Audio";

  if (audioTracks.length <= 1) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
        <span>{currentLabel}</span>
        <svg className={`h-3 w-3 transition ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-1 w-36 rounded bg-[#1a1a1a] border border-white/10 py-1 shadow-lg">
          {audioTracks.map((track) => (
            <button
              key={track.id}
              onClick={() => {
                if (videoRef.current) {
                  const video = videoRef.current as HTMLVideoElement & { audioTracks?: any };
                  const tracks = video.audioTracks;
                  if (tracks) {
                    for (let i = 0; i < tracks.length; i++) {
                      tracks[i].enabled = i === track.id;
                    }
                  }
                }
                setAudioTracks(audioTracks.map(t => ({ ...t, enabled: t.id === track.id })));
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs hover:bg-white/10 ${
                track.enabled ? 'text-red-500' : 'text-white'
              }`}
            >
              {track.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function VideoPlayer({ src, poster, introStart, introEnd, outroStart }: VideoPlayerProps) {
  const [playerType, setPlayerType] = useState<PlayerType>("native");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [subtitleSize, setSubtitleSize] = useState(100);
  const [subtitleColor, setSubtitleColor] = useState("#ffffff");
  const [subtitleBg, setSubtitleBg] = useState("rgba(0,0,0,0.7)");
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const vidstackRef = useRef<any>(null);

  const isHLS = src?.includes('.m3u8') || src?.includes('mux.com') || src?.includes('stream.mux');
  const isMux = src?.includes('mux.com') || src?.includes('stream.mux') || src?.includes('mux.net');
  const isMKV = src?.toLowerCase().includes('.mkv');
  const isMP4 = src?.toLowerCase().includes('.mp4');

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

    if (isMKV) {
      console.warn("MKV format may not work in native player. Try Vidstack or WebComponent player.");
      return;
    }

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
  }, [src, isHLS, isMKV, playerType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const skipTo = (time: number) => {
    if (playerType === "native" && videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, videoRef.current.duration || 0));
    }
  };

  const skipIntro = () => {
    if (introEnd && videoRef.current) {
      videoRef.current.currentTime = introEnd;
    }
  };

  const skipOutro = () => {
    if (outroStart && videoRef.current) {
      videoRef.current.currentTime = outroStart;
    }
  };

  const playerOptions = [
    { type: "native" as PlayerType, label: "Native", available: true },
    { type: "mux" as PlayerType, label: "Mux", available: isMux },
    { type: "vidstack" as PlayerType, label: "Vidstack", available: true },
    { type: "webcomponent" as PlayerType, label: "WebComponent", available: isHLS || isMKV },
    { type: "playerjs" as PlayerType, label: "Playerjs", available: true },
  ].filter(opt => opt.available);

  return (
    <div className="w-full bg-black">
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        {/* Controls Bar */}
        <div className="absolute top-2 right-2 z-20 flex gap-2">
          {(introEnd || outroStart) && (playerType === "native" || playerType === "playerjs") && (
            <div className="flex gap-1">
              {introEnd && (
                <button
                  onClick={skipIntro}
                  className="flex items-center gap-1 rounded bg-white/10 px-2 py-1.5 text-xs text-white hover:bg-white/20"
                  title="Skip Intro"
                >
                  Skip Intro
                </button>
              )}
              {outroStart && (
                <button
                  onClick={skipOutro}
                  className="flex items-center gap-1 rounded bg-white/10 px-2 py-1.5 text-xs text-white hover:bg-white/20"
                  title="Skip Outro"
                >
                  Skip Outro
                </button>
              )}
            </div>
          )}
          {playerType === "native" && (
            <div ref={settingsRef} className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1 rounded bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
              >
                <span>CC</span>
                <svg className={`h-3 w-3 transition ${showSettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded bg-[#1a1a1a] border border-white/10 p-3 shadow-lg">
                  <p className="mb-2 text-xs font-medium text-gray-400">Subtitle Settings</p>
                  <div className="mb-3">
                    <label className="mb-1 block text-xs text-gray-500">Size: {subtitleSize}%</label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={subtitleSize}
                      onChange={(e) => setSubtitleSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="mb-1 block text-xs text-gray-500">Color</label>
                    <div className="flex gap-2">
                      {["#ffffff", "#ffff00", "#00ff00", "#00ffff", "#ff0000", "#ff00ff"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setSubtitleColor(color)}
                          className={`h-6 w-6 rounded ${subtitleColor === color ? 'ring-2 ring-red-500' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Background</label>
                    <div className="flex gap-2">
                      {[
                        { label: "None", value: "transparent" },
                        { label: "Dark", value: "rgba(0,0,0,0.7)" },
                        { label: "Light", value: "rgba(255,255,255,0.7)" }
                      ].map((bg) => (
                        <button
                          key={bg.value}
                          onClick={() => setSubtitleBg(bg.value)}
                          className={`rounded px-2 py-1 text-xs ${subtitleBg === bg.value ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-300'}`}
                        >
                          {bg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={dropdownRef} className="relative">
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
              <div className="absolute right-0 top-full mt-1 w-32 rounded bg-[#1a1a1a] border border-white/10 py-1 shadow-lg">
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
        </div>

        {/* Native Player */}
        {playerType === "native" && (
          <>
            <style>{`
              ::cue {
                color: ${subtitleColor};
                background-color: ${subtitleBg};
                font-size: ${subtitleSize}%;
              }
            `}</style>
            <video
              ref={videoRef}
              poster={poster}
              controls
              playsInline
              className="h-full w-full"
            />
            <div className="absolute top-2 left-2 z-20">
              <NativeAudioSelector videoRef={videoRef} />
            </div>
          </>
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
        {playerType === "vidstack" && (
          <MediaPlayer
            ref={vidstackRef}
            src={src}
            viewType="video"
            streamType="on-demand"
            logLevel="warn"
            crossOrigin
            playsInline
            poster={poster}
            autoplay
            className="h-full w-full"
          >
            <MediaProvider>
              <Poster className="vds-poster" />
            </MediaProvider>
            <div className="absolute top-2 right-2 z-20">
              <AudioTrackSelectorVidstack />
            </div>
            <DefaultVideoLayout thumbnails={poster} icons={defaultLayoutIcons} />
          </MediaPlayer>
        )}

        {/* Web Component Player */}
        {playerType === "webcomponent" && isHLS && (
          <iframe
            src={`/api/vidstack-iframe?src=${encodeURIComponent(src)}&poster=${encodeURIComponent(poster || '')}`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        )}

        {/* Playerjs Player */}
        {playerType === "playerjs" && (
          <PlayerjsPlayer
            src={src}
            poster={poster}
            title={""}
          />
        )}
      </div>
    </div>
  );
}
