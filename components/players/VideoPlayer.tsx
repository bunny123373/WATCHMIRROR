"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { MediaPlayer, MediaProvider, Poster, useAudioOptions } from "@vidstack/react";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import PlayerjsPlayer from "./PlayerjsPlayer";
import VideojsPlayer from "./VideojsPlayer";
import { ContentType, SubtitleTrack } from "@/types/content";
import { useAppDispatch } from "@/store/hooks";
import { removeContinue, upsertContinue } from "@/store/slices/continueSlice";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  subtitleTracks?: SubtitleTrack[];
  introStart?: number;
  introEnd?: number;
  outroStart?: number;
  slug?: string;
  type?: ContentType;
  seasonNumber?: number;
  episodeNumber?: number;
  title?: string;
  onNearEndChange?: (payload: { isNearEnd: boolean; remainingTime: number; duration: number }) => void;
  onEnded?: () => void;
}

type PlayerType = "native" | "videojs" | "vidstack" | "mux" | "webcomponent" | "playerjs";
const CONTINUE_KEY = "watchmirror_continue_watching";
const PROFILE_KEY = "watchmirror_profile";

function getActiveProfileName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PROFILE_KEY)?.trim() || "";
}

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

export function VideoPlayer({
  src,
  poster,
  subtitleTracks = [],
  introStart,
  introEnd,
  outroStart,
  slug,
  type,
  seasonNumber,
  episodeNumber,
  title,
  onNearEndChange,
  onEnded
}: VideoPlayerProps) {
  const dispatch = useAppDispatch();
  const [playerType, setPlayerType] = useState<PlayerType>("native");
  const [showSettings, setShowSettings] = useState(false);
  const [subtitleSize, setSubtitleSize] = useState(100);
  const [subtitleColor, setSubtitleColor] = useState("#ffffff");
  const [subtitleBg, setSubtitleBg] = useState("rgba(0,0,0,0.7)");
  const playerShellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const vidstackRef = useRef<any>(null);
  const lastSyncedTimeRef = useRef(0);

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
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    type ScreenLockMode = "any" | "natural" | "landscape" | "portrait" | "portrait-primary" | "portrait-secondary" | "landscape-primary" | "landscape-secondary";
    const orientation = screen.orientation as (ScreenOrientation & {
      lock?: (orientation: ScreenLockMode) => Promise<void>;
      unlock?: () => void;
    }) | undefined;

    const handleFullscreenChange = async () => {
      const fullscreenElement = document.fullscreenElement;
      const playerShell = playerShellRef.current;
      const isPlayerFullscreen = Boolean(
        fullscreenElement &&
        playerShell &&
        (fullscreenElement === playerShell || playerShell.contains(fullscreenElement))
      );

      if (isPlayerFullscreen) {
        try {
          await orientation?.lock?.("landscape");
        } catch {}
        return;
      }

      try {
        orientation?.unlock?.();
      } catch {}
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      try {
        orientation?.unlock?.();
      } catch {}
    };
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

  const saveContinueWatching = useCallback((currentTime: number, duration: number) => {
    if (!slug || !type || !videoRef.current || duration <= 0) return;
    
    const progress = currentTime / duration;

    try {
      const existing = localStorage.getItem(CONTINUE_KEY);
      const items = existing ? JSON.parse(existing) : [];
      
      const newItem = {
        slug,
        type,
        title: title || "",
        poster: poster || "",
        currentTime,
        duration,
        seasonNumber,
        episodeNumber,
        updatedAt: new Date().toISOString()
      };
      
      const idx = items.findIndex((item: any) =>
        item.slug === slug && 
        item.seasonNumber === seasonNumber && 
        item.episodeNumber === episodeNumber
      );
      
      if (progress < 0.05 || progress > 0.95) {
        if (idx >= 0) {
          items.splice(idx, 1);
        }
      } else if (idx >= 0) {
        items[idx] = newItem;
      } else {
        items.unshift(newItem);
      }
      
      const sorted = items
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10);
      
      localStorage.setItem(CONTINUE_KEY, JSON.stringify(sorted));
    } catch (e) {
      console.error("Failed to save continue watching:", e);
    }
  }, [slug, type, title, poster, seasonNumber, episodeNumber]);

  const syncContinueWatching = useCallback(async (currentTime: number, duration: number, force = false) => {
    if (!slug || !type || duration <= 0) return;

    const progressItem = {
      slug,
      type,
      title: title || "",
      poster: poster || "",
      currentTime,
      duration,
      seasonNumber,
      episodeNumber
    };

    saveContinueWatching(currentTime, duration);

    const progress = currentTime / duration;
    if (progress < 0.05 || progress > 0.95) {
      dispatch(removeContinue({ slug, seasonNumber, episodeNumber }));
    } else {
      dispatch(
        upsertContinue({
          ...progressItem,
          updatedAt: new Date().toISOString()
        })
      );
    }

    const profileName = getActiveProfileName();
    if (!profileName) return;
    if (!force && Math.abs(currentTime - lastSyncedTimeRef.current) < 10) return;
    lastSyncedTimeRef.current = currentTime;

    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileName,
          ...progressItem
        })
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data.removed) {
        dispatch(removeContinue({ slug, seasonNumber, episodeNumber }));
        return;
      }

      if (data.item) {
        dispatch(upsertContinue(data.item));
      }
    } catch {}
  }, [dispatch, episodeNumber, poster, saveContinueWatching, seasonNumber, slug, title, type]);

  useEffect(() => {
    if (!slug || !videoRef.current || playerType !== "native") return;

    const video = videoRef.current;

    const loadSavedProgress = async () => {
      try {
        const profileName = getActiveProfileName();
        if (profileName) {
          const params = new URLSearchParams({
            profile: profileName,
            slug
          });

          if (seasonNumber !== undefined) params.set("seasonNumber", String(seasonNumber));
          if (episodeNumber !== undefined) params.set("episodeNumber", String(episodeNumber));

          const res = await fetch(`/api/progress?${params.toString()}`, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            const saved = data.item;
            if (saved?.currentTime && saved?.duration) {
              const progress = saved.currentTime / saved.duration;
              if (progress > 0.05 && progress < 0.95) {
                video.currentTime = saved.currentTime;
                dispatch(upsertContinue(saved));
                return;
              }
            }
          }
        }

        const existing = localStorage.getItem(CONTINUE_KEY);
        if (!existing) return;
        const items = JSON.parse(existing);
        const saved = items.find((item: any) =>
          item.slug === slug &&
          item.seasonNumber === seasonNumber &&
          item.episodeNumber === episodeNumber
        );
        if (saved && saved.currentTime && saved.duration) {
          const progress = saved.currentTime / saved.duration;
          if (progress > 0.05 && progress < 0.95) {
            video.currentTime = saved.currentTime;
            dispatch(upsertContinue(saved));
          }
        }
      } catch {}
    };

    video.addEventListener('loadedmetadata', loadSavedProgress);
    
    const handleTimeUpdate = () => {
      if (video.currentTime > 0 && video.duration > 0) {
        const remainingTime = Math.max(0, video.duration - video.currentTime);
        onNearEndChange?.({
          isNearEnd: remainingTime <= 15,
          remainingTime,
          duration: video.duration
        });
        syncContinueWatching(video.currentTime, video.duration);
      }
    };
    
    const handlePause = () => {
      const remainingTime = Math.max(0, (video.duration || 0) - video.currentTime);
      onNearEndChange?.({ isNearEnd: false, remainingTime, duration: video.duration || 0 });
      if (video.currentTime > 0 && video.duration > 0) {
        syncContinueWatching(video.currentTime, video.duration, true);
      }
    };

    const handleEnded = () => {
      onNearEndChange?.({ isNearEnd: false, remainingTime: 0, duration: video.duration || 0 });
      onEnded?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    
    return () => {
      if (video.currentTime > 0 && video.duration > 0) {
        syncContinueWatching(video.currentTime, video.duration, true);
      }
      video.removeEventListener('loadedmetadata', loadSavedProgress);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [dispatch, episodeNumber, onEnded, onNearEndChange, playerType, seasonNumber, slug, syncContinueWatching]);

  const playerOptions = [
    { type: "native" as PlayerType, label: "Native", available: true },
    { type: "videojs" as PlayerType, label: "Video.js", available: true },
    { type: "mux" as PlayerType, label: "Mux", available: isMux },
    { type: "vidstack" as PlayerType, label: "Vidstack", available: true },
    { type: "webcomponent" as PlayerType, label: "WebComponent", available: isHLS || isMKV },
    { type: "playerjs" as PlayerType, label: "Playerjs", available: true },
  ].filter(opt => opt.available);

  return (
    <div className="w-full bg-black">
      <div ref={playerShellRef} className="relative w-full" style={{ aspectRatio: '16/9' }}>
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
            >
              {subtitleTracks.map((track) => (
                <track
                  key={`${track.lang}-${track.label}-${track.url}`}
                  kind="subtitles"
                  src={track.url}
                  srcLang={track.lang}
                  label={track.label}
                  default={track.isDefault}
                />
              ))}
            </video>
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

        {/* Video.js Player */}
        {playerType === "videojs" && (
          <VideojsPlayer
            src={src}
            poster={poster}
            subtitleTracks={subtitleTracks}
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
            subtitle={subtitleTracks.find((track) => track.isDefault)?.url || subtitleTracks[0]?.url}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-[#111] px-3 py-2">
        <span className="text-xs font-medium text-gray-400">Player</span>
        {playerOptions.map((opt) => (
          <button
            key={opt.type}
            onClick={() => setPlayerType(opt.type)}
            className={`rounded px-3 py-1.5 text-xs transition ${
              playerType === opt.type
                ? "bg-red-600 text-white"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
