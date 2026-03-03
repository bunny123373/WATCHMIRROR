"use client";

import { useRef, useState } from "react";
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
  const subtitleTracks = (props.subtitleTracks || []).filter((track) => Boolean(track?.url));
  const rawSources: StreamingSource[] = [
    { type: "hls", url: props.hlsLink || "", label: "Primary HLS" },
    { type: "hls", url: props.backupHlsLink || "", label: "Backup HLS" },
    { type: "iframe", url: props.embedIframeLink || "", label: "Primary Embed" },
    { type: "iframe", url: props.backupEmbedIframeLink || "", label: "Backup Embed" }
  ];
  const sources: StreamingSource[] = rawSources.filter((item) => item.url.trim().length > 0);

  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const activeSource = sources[activeSourceIndex];

  usePlaybackTracker({
    videoRef,
    base: {
      slug: props.slug,
      type: props.type,
      title: props.title,
      poster: props.poster,
      seasonNumber: props.seasonNumber,
      episodeNumber: props.episodeNumber
    }
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
          onFatal={() => {
            if (activeSourceIndex < sources.length - 1) {
              setActiveSourceIndex((prev) => prev + 1);
            }
          }}
        />
      ) : (
        <IframePlayer src={activeSource.url} />
      )}

      {sources.length > 1 && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-[#2a2a2a] bg-[#181818] p-2">
          {sources.map((source, index) => (
            <button
              key={`${source.type}-${source.label}-${index}`}
              type="button"
              onClick={() => setActiveSourceIndex(index)}
              className={`rounded-md border px-3 py-1.5 text-xs ${
                index === activeSourceIndex ? "border-[#E50914] bg-[#E50914] text-white" : "border-[#3a3a3a] text-[#d4d4d4]"
              }`}
            >
              {source.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
