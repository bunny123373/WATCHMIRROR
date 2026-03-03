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

    let hls: Hls | null = null;

    const onLoaded = () => {
      setLoading(false);
      onReady?.(video);
    };

    video.addEventListener("loadeddata", onLoaded);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError("Playback error. Please try another source.");
          onFatal?.();
        }
      });
    } else {
      setError("HLS is not supported in this browser.");
      setLoading(false);
    }

    return () => {
      video.removeEventListener("loadeddata", onLoaded);
      hls?.destroy();
    };
  }, [src, onReady, onFatal]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1F232D] bg-[#0E1015]">
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/70 text-sm text-red-400">
          <AlertCircle size={16} /> {error}
        </div>
      )}
    </div>
  );
}
