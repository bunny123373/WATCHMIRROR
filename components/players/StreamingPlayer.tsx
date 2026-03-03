"use client";

import { useRef } from "react";
import HLSPlayer from "@/components/players/HLSPlayer";
import IframePlayer from "@/components/players/IframePlayer";
import { usePlaybackTracker } from "@/hooks/usePlaybackTracker";
import { ContentType } from "@/types/content";

interface StreamingPlayerProps {
  type: ContentType;
  slug: string;
  title: string;
  poster: string;
  hlsLink?: string;
  embedIframeLink?: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

export default function StreamingPlayer(props: StreamingPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

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

  if (props.hlsLink) {
    return <HLSPlayer src={props.hlsLink} videoRef={videoRef} />;
  }

  if (props.embedIframeLink) {
    return <IframePlayer src={props.embedIframeLink} />;
  }

  return (
    <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted">
      Streaming not available
    </div>
  );
}