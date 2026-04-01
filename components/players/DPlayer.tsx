"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";

interface SubtitleTrack {
  label: string;
  url: string;
}

interface PlaylistItem {
  title: string;
  url: string;
  pic?: string;
}

interface DPlayerProps {
  videoUrl: string;
  videoPic?: string;
  thumbnails?: string;
  subtitleUrl?: string;
  subtitleTracks?: SubtitleTrack[];
  subtitleType?: string;
  danmakuId?: string;
  danmakuApi?: string;
  screenshot?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  lang?: string;
  hotkey?: boolean;
  preload?: string;
  volume?: number;
  mutex?: boolean;
  dark?: boolean;
  qualities?: { name: string; url: string }[];
  initialTime?: number;
  playbackRate?: number;
  customHotkeys?: Record<string, (player: DPlayerInstance) => void>;
  enablePip?: boolean;
  enableAirplay?: boolean;
  playlist?: PlaylistItem[];
  onPlaylistChange?: (index: number) => void;
  showThumbnails?: boolean;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onBuffering?: (isBuffering: boolean) => void;
  onVolumeChange?: (volume: number) => void;
  onTimeUpdate?: (currentTime: number) => void;
}

declare global {
  interface Window {
    DPlayer: new (options: DPlayerOptions) => DPlayerInstance;
  }
}

interface DPlayerOptions {
  container: HTMLElement;
  screenshot?: boolean;
  video: {
    url: string;
    pic?: string;
    thumbnails?: string;
    quality?: { name: string; url: string }[];
  };
  subtitle?: {
    url: string;
    type?: string;
  } | undefined;
  danmaku?: {
    id: string;
    api: string;
  };
  autoplay?: boolean;
  loop?: boolean;
  lang?: string;
  hotkey?: boolean;
  preload?: string;
  volume?: number;
  mutex?: boolean;
  dark?: boolean;
}

interface DPlayerInstance {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  volume: (volume: number) => void;
  speed: (rate: number) => void;
  destroy: () => void;
  video: {
    currentTime: number;
    volume: number;
    paused: boolean;
    playbackRate: number;
  };
  on: (event: string, callback: (...args: unknown[]) => void) => void;
}

export interface DPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  volume: (volume: number) => void;
  speed: (rate: number) => void;
  destroy: () => void;
  getCurrentTime: () => number;
  enterPip: () => Promise<void>;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const DPlayer = forwardRef<DPlayerRef, DPlayerProps>(
  (
    {
      videoUrl,
      videoPic,
      thumbnails,
      subtitleUrl,
      subtitleTracks,
      subtitleType = "webvtt",
      danmakuId,
      danmakuApi,
      screenshot = true,
      autoplay = false,
      loop = false,
      lang = "en",
      hotkey = true,
      preload = "auto",
      volume = 0.7,
      mutex = true,
      dark = false,
      qualities,
      initialTime = 0,
      playbackRate = 1,
      customHotkeys,
      enablePip = false,
      enableAirplay = false,
      playlist,
      onPlaylistChange,
      showThumbnails = false,
      onReady,
      onPlay,
      onPause,
      onEnded,
      onBuffering,
      onVolumeChange,
      onTimeUpdate,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dpRef = useRef<DPlayerInstance | null>(null);
    const [isTheater, setIsTheater] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
    const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);

    useImperativeHandle(ref, () => ({
      play: () => dpRef.current?.play(),
      pause: () => dpRef.current?.pause(),
      seek: (time: number) => dpRef.current?.seek(time),
      volume: (vol: number) => dpRef.current?.volume(vol),
      speed: (rate: number) => dpRef.current?.speed(rate),
      destroy: () => dpRef.current?.destroy(),
      getCurrentTime: () => dpRef.current?.video.currentTime || 0,
      enterPip: async () => {
        const video = containerRef.current?.querySelector("video");
        if (video && document.pictureInPictureEnabled) {
          await video.requestPictureInPicture();
        }
      },
      nextVideo: () => {
        if (playlist && currentPlaylistIndex < playlist.length - 1) {
          setCurrentPlaylistIndex(currentPlaylistIndex + 1);
          onPlaylistChange?.(currentPlaylistIndex + 1);
        }
      },
      prevVideo: () => {
        if (playlist && currentPlaylistIndex > 0) {
          setCurrentPlaylistIndex(currentPlaylistIndex - 1);
          onPlaylistChange?.(currentPlaylistIndex - 1);
        }
      },
    }));

    useEffect(() => {
      const initDPlayer = async () => {
        if (!containerRef.current) return;

        if (typeof window !== "undefined" && !window.DPlayer) {
          await Promise.all([
            new Promise<void>((resolve) => {
              const script = document.createElement("script");
              script.src = "https://cdn.jsdelivr.net/npm/dplayer@1.27.1/dist/DPlayer.min.js";
              script.async = true;
              script.onload = () => resolve();
              document.body.appendChild(script);
            }),
            new Promise<void>((resolve) => {
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = "https://cdn.jsdelivr.net/npm/dplayer@1.27.1/dist/DPlayer.min.css";
              link.onload = () => resolve();
              document.head.appendChild(link);
            }),
          ]);
        }

        if (window.DPlayer && containerRef.current && !dpRef.current) {
          dpRef.current = new window.DPlayer({
            container: containerRef.current,
            screenshot,
            video: {
              url: videoUrl,
              pic: videoPic,
              thumbnails,
              quality: qualities,
            },
            subtitle: subtitleUrl ? { url: subtitleUrl, type: subtitleType } : undefined,
            danmaku: danmakuId && danmakuApi ? { id: danmakuId, api: danmakuApi } : undefined,
            autoplay,
            loop,
            lang,
            hotkey,
            preload,
            volume,
            mutex,
            dark,
          });

          if (initialTime > 0) {
            dpRef.current.seek(initialTime);
          }

          if (playbackRate !== 1) {
            dpRef.current.speed(playbackRate);
          }

          if (customHotkeys && Object.keys(customHotkeys).length > 0) {
            document.addEventListener("keydown", (e) => {
              const player = dpRef.current;
              if (!player) return;
              const handler = customHotkeys[e.key];
              if (handler) {
                e.preventDefault();
                handler(player);
              }
            });
          }

          if (enablePip && containerRef.current) {
            const video = containerRef.current.querySelector("video");
            if (video) {
              const pipButton = document.createElement("button");
              pipButton.textContent = "PiP";
              pipButton.className = "dplayer-icon dplayer-pip-icon";
              pipButton.onclick = async () => {
                try {
                  if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                  } else if (video) {
                    await video.requestPictureInPicture();
                  }
                } catch (err) {
                  console.error("PiP error:", err);
                }
              };
              const controlBar = containerRef.current.querySelector(".dplayer-control-bar");
              if (controlBar) {
                controlBar.appendChild(pipButton);
              }
            }
          }

          dpRef.current.on("ready", () => onReady?.());
          dpRef.current.on("play", () => onPlay?.());
          dpRef.current.on("pause", () => onPause?.());
          dpRef.current.on("ended", () => onEnded?.());
          dpRef.current.on("buffering", (buffering: unknown) => {
            const isBuffering = buffering as boolean;
            setIsBuffering(isBuffering);
            onBuffering?.(isBuffering);
          });
          dpRef.current.on("volume_change", (vol: unknown) => onVolumeChange?.(vol as number));
          dpRef.current.on("time_update", (time: unknown) => onTimeUpdate?.(time as number));
        }
      };

      initDPlayer();

      return () => {
        if (dpRef.current) {
          dpRef.current.destroy();
          dpRef.current = null;
        }
      };
    }, [videoUrl, videoPic, thumbnails, subtitleUrl, subtitleTracks, danmakuId, danmakuApi, dark, playlist]);

    const toggleTheater = () => {
      setIsTheater(!isTheater);
    };

    const handleSpeedChange = (rate: number) => {
      if (dpRef.current) {
        dpRef.current.speed(rate);
      }
    };

    return (
      <div className={`${isTheater ? "fixed inset-0 z-50 bg-black" : ""}`}>
        {isBuffering && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          </div>
        )}

        {subtitleTracks && subtitleTracks.length > 1 && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-gray-400">Subtitle:</span>
            <select
              value={currentSubtitleIndex}
              onChange={(e) => setCurrentSubtitleIndex(Number(e.target.value))}
              className="rounded bg-[#2a2a2a] px-2 py-1 text-xs text-white"
            >
              <option value={-1}>Off</option>
              {subtitleTracks.map((track, index) => (
                <option key={index} value={index}>
                  {track.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button
            onClick={toggleTheater}
            className="rounded bg-[#2a2a2a] px-3 py-1.5 text-xs text-white hover:bg-[#3a3a3a]"
          >
            {isTheater ? "Exit Theater" : "Theater Mode"}
          </button>

          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Speed:</span>
            <select
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              defaultValue={playbackRate}
              className="rounded bg-[#2a2a2a] px-2 py-1 text-xs text-white"
            >
              {PLAYBACK_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}x
                </option>
              ))}
            </select>
          </div>

          {playlist && playlist.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const newIndex = Math.max(0, currentPlaylistIndex - 1);
                  setCurrentPlaylistIndex(newIndex);
                  onPlaylistChange?.(newIndex);
                }}
                disabled={currentPlaylistIndex === 0}
                className="rounded bg-[#2a2a2a] px-2 py-1 text-xs text-white disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-xs text-gray-400">
                {currentPlaylistIndex + 1}/{playlist.length}
              </span>
              <button
                onClick={() => {
                  const newIndex = Math.min(playlist.length - 1, currentPlaylistIndex + 1);
                  setCurrentPlaylistIndex(newIndex);
                  onPlaylistChange?.(newIndex);
                }}
                disabled={currentPlaylistIndex === playlist.length - 1}
                className="rounded bg-[#2a2a2a] px-2 py-1 text-xs text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div
          ref={containerRef}
          id="dplayer"
          className={isTheater ? "h-screen w-screen" : ""}
          style={{
            width: "100%",
            maxWidth: isTheater ? "none" : "800px",
            margin: "0 auto",
          }}
        />
      </div>
    );
  }
);

DPlayer.displayName = "DPlayer";

export default DPlayer;
