"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HLSPlayer from "@/components/players/HLSPlayer";
import IframePlayer from "@/components/players/IframePlayer";
import { usePlaybackTracker } from "@/hooks/usePlaybackTracker";
import { ContentType, SubtitleTrack } from "@/types/content";

type SourceType = "hls" | "iframe";

interface StreamingSource {
  type: SourceType;
  url: string;
  label: string;
}

interface StreamingPlayerProps {
  type: ContentType;
  slug: string;
  title: string;
  poster: string;
  hlsLink?: string;
  embedIframeLink?: string;
  backupHlsLink?: string;
  backupEmbedIframeLink?: string;
  subtitleTracks?: SubtitleTrack[];
  seasonNumber?: number;
  episodeNumber?: number;
}

export default function StreamingPlayer(props: StreamingPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const subtitleTracks = useMemo(
    () => (props.subtitleTracks || []).filter((track) => Boolean(track?.url)),
    [props.subtitleTracks]
  );
  const sources: StreamingSource[] = useMemo(() => {
    const rawSources: StreamingSource[] = [
      { type: "hls", url: props.hlsLink || "", label: "Primary HLS" },
      { type: "hls", url: props.backupHlsLink || "", label: "Backup HLS" },
      { type: "iframe", url: props.embedIframeLink || "", label: "Primary Embed" },
      { type: "iframe", url: props.backupEmbedIframeLink || "", label: "Backup Embed" }
    ];
    return rawSources.filter((item) => item.url.trim().length > 0);
  }, [props.hlsLink, props.backupHlsLink, props.embedIframeLink, props.backupEmbedIframeLink]);

  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const activeSource = sources[activeSourceIndex];
  const trackerBase = useMemo(
    () => ({
      slug: props.slug,
      type: props.type,
      title: props.title,
      poster: props.poster,
      seasonNumber: props.seasonNumber,
      episodeNumber: props.episodeNumber
    }),
    [props.slug, props.type, props.title, props.poster, props.seasonNumber, props.episodeNumber]
  );

  useEffect(() => {
    if (activeSourceIndex >= sources.length) {
      setActiveSourceIndex(0);
    }
  }, [activeSourceIndex, sources.length]);

  const handleFatal = useCallback(() => {
    setActiveSourceIndex((prev) => (prev < sources.length - 1 ? prev + 1 : prev));
  }, [sources.length]);

  usePlaybackTracker({
    videoRef,
    base: trackerBase
  });

  if (!activeSource) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted">
        Streaming not available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeSource.type === "hls" ? (
        <HLSPlayer
          src={activeSource.url}
          subtitles={subtitleTracks}
          videoRef={videoRef}
          onFatal={handleFatal}
        />
      ) : (
        <IframePlayer src={activeSource.url} />
      )}

      {sources.length > 1 && (
        <div className="space-y-2 rounded-xl border border-[#2a2a2a] bg-[#181818] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#a3a3a3]">
            Source: <span className="text-white">{activeSource.label}</span>
          </p>
          <div className="flex flex-wrap gap-2">
          {sources.map((source, index) => (
            <button
              key={`${source.type}-${source.label}-${index}`}
              type="button"
              onClick={() => setActiveSourceIndex(index)}
              aria-pressed={index === activeSourceIndex}
              className={`rounded-md border px-3 py-1.5 text-xs ${
                index === activeSourceIndex ? "border-[#E50914] bg-[#E50914] text-white" : "border-[#3a3a3a] text-[#d4d4d4]"
              }`}
            >
              {source.label}
            </button>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
