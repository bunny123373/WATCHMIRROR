"use client";

import { useState } from "react";
import { VideoPlayer } from "@/components/players/VideoPlayer";
import IframePlayer from "@/components/players/IframePlayer";
import { ContentType } from "@/types/content";

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
}

export default function StreamingPlayer(props: StreamingPlayerProps) {
  const sources: StreamingSource[] = [
    { type: "hls" as SourceType, url: props.hlsLink || "", label: "Primary HLS" },
    { type: "hls" as SourceType, url: props.backupHlsLink || "", label: "Backup HLS" },
    { type: "iframe" as SourceType, url: props.embedIframeLink || "", label: "Primary Embed" },
    { type: "iframe" as SourceType, url: props.backupEmbedIframeLink || "", label: "Backup Embed" }
  ].filter((item) => item.url.trim().length > 0);

  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const activeSource = sources[activeSourceIndex];

  if (!activeSource) {
    return (
      <div className="flex aspect-video items-center justify-center bg-[#181818] text-gray-400">
        Streaming not available
      </div>
    );
  }

  return (
    <div>
      {activeSource.type === "hls" ? (
        <VideoPlayer src={activeSource.url} poster={props.poster} />
      ) : (
        <IframePlayer src={activeSource.url} />
      )}

      {sources.length > 1 && (
        <div className="mx-4 mt-3 rounded-lg border border-[#2a2a2a] bg-[#181818] p-3">
          <p className="mb-2 text-xs text-gray-400">
            Source: <span className="text-white">{activeSource.label}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <button
                key={index}
                onClick={() => setActiveSourceIndex(index)}
                className={`rounded px-3 py-1.5 text-xs ${
                  index === activeSourceIndex ? "bg-red-600 text-white" : "bg-[#2a2a2a] text-gray-300"
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
