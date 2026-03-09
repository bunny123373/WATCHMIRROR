"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle, Settings, Maximize, Minimize, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { SubtitleTrack } from "@/types/content";

interface HLSPlayerProps {
  src: string;
  subtitles?: SubtitleTrack[];
  videoRef?: RefObject<HTMLVideoElement | null>;
  onReady?: (video: HTMLVideoElement) => void;
  onFatal?: () => void;
}

export default function HLSPlayer({ src, subtitles = [], videoRef: controlledRef, onReady, onFatal }: HLSPlayerProps) {
  const internalRef = useRef<HTMLVideoElement>(null);
  const videoRef = controlledRef ?? internalRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityLevels, setQualityLevels] = useState<{ height: number; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!src) {
      setError("Streaming source unavailable.");
      setLoading(false);
      return;
    }

    let hls: Hls | null = null;
    let recoveredNetwork = false;
    let recoveredMedia = false;

    setLoading(true);
    setError(null);
    setQualityLevels([]);

    const onLoaded = () => {
      setLoading(false);
      onReady?.(video);
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => { setLoading(false); setIsPlaying(true); };
    const onPause = () => setIsPlaying(false);
    const onVideoError = () => {
      setLoading(false);
      setError("Playback error. Please try another source.");
      onFatal?.();
    };

    video.preload = "auto";
    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("canplay", onLoaded);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onVideoError);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.load();
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60
      });
      hlsRef.current = hls;
      
      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((level, index) => ({
          height: level.height,
          index
        }));
        setQualityLevels(levels);
      });
      
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && !recoveredNetwork) {
            recoveredNetwork = true;
            hls?.startLoad();
            return;
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recoveredMedia) {
            recoveredMedia = true;
            hls?.recoverMediaError();
            return;
          }
          setError("Playback error. Please try another source.");
          setLoading(false);
          onFatal?.();
        }
      });
    } else {
      setError("HLS is not supported in this browser.");
      setLoading(false);
    }

    return () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("canplay", onLoaded);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onVideoError);
      hls?.destroy();
      hlsRef.current = null;
    };
  }, [src, onReady, onFatal, videoRef]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const changeQuality = (qualityIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = qualityIndex;
      setShowSettings(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case "arrowup":
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          break;
        case "q":
          e.preventDefault();
          if (qualityLevels.length > 0) {
            setShowSettings(!showSettings);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSettings, qualityLevels.length]);

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-black group">
      <video 
        ref={videoRef} 
        controls 
        playsInline 
        className="aspect-video w-full bg-black"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(true)}
      >
        {subtitles.map((track) => (
          <track
            key={`${track.lang}-${track.label}-${track.url}`}
            kind="subtitles"
            srcLang={track.lang}
            label={track.label}
            src={track.url}
            default={Boolean(track.isDefault)}
          />
        ))}
      </video>

      {qualityLevels.length > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <Settings size={16} />
          </button>
          {showSettings && (
            <div className="absolute right-0 top-10 w-40 rounded-lg bg-black/90 p-2 shadow-xl">
              <p className="mb-2 border-b border-white/10 pb-2 text-xs font-semibold text-white">Quality</p>
              <button
                onClick={() => changeQuality(-1)}
                className={`block w-full rounded px-3 py-2 text-left text-xs ${currentQuality === -1 ? "bg-red-600 text-white" : "text-gray-300 hover:bg-white/10"}`}
              >
                Auto
              </button>
              {qualityLevels.map((level) => (
                <button
                  key={level.index}
                  onClick={() => changeQuality(level.index)}
                  className={`block w-full rounded px-3 py-2 text-left text-xs ${currentQuality === level.index ? "bg-red-600 text-white" : "text-gray-300 hover:bg-white/10"}`}
                >
                  {level.height}p
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="animate-spin text-white" size={40} />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/80 text-sm text-red-500">
          <AlertCircle size={16} /> {error}
        </div>
      )}
    </div>
  );
}
