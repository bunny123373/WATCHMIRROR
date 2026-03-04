"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    const onLoaded = () => {
      setLoading(false);
      onReady?.(video);
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
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
      hls.loadSource(src);
      hls.attachMedia(video);
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
      video.removeEventListener("error", onVideoError);
      hls?.destroy();
    };
  }, [src, onReady, onFatal]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-black">
      <video ref={videoRef} controls playsInline className="aspect-video w-full bg-black">
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

      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="animate-spin text-white" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/80 text-sm text-[#E50914]">
          <AlertCircle size={16} /> {error}
        </div>
      )}
    </div>
  );
}
