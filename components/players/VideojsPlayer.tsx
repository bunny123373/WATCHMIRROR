"use client";

import "@videojs/react/video/minimal-skin.css";
import { createPlayer } from "@videojs/react";
import { videoFeatures, MinimalVideoSkin, Video } from "@videojs/react/video";
import { HlsVideo } from "@videojs/react/media/hls-video";
import { SubtitleTrack } from "@/types/content";

const Player = createPlayer({ features: videoFeatures });

interface VideojsPlayerProps {
  src: string;
  poster?: string;
  subtitleTracks?: SubtitleTrack[];
}

export default function VideojsPlayer({ src, poster, subtitleTracks = [] }: VideojsPlayerProps) {
  const isHls = src.includes(".m3u8") || src.includes("mux.com") || src.includes("stream.mux");

  return (
    <Player.Provider>
      <MinimalVideoSkin poster={poster}>
        {isHls ? (
          <HlsVideo src={src} poster={poster} playsInline preload="auto">
            {subtitleTracks.map((track) => (
              <track
                key={`${track.lang}-${track.label}-${track.url}`}
                kind="subtitles"
                src={track.url}
                srcLang={track.lang}
                label={track.label}
                default={Boolean(track.isDefault)}
              />
            ))}
          </HlsVideo>
        ) : (
          <Video src={src} poster={poster} playsInline preload="auto">
            {subtitleTracks.map((track) => (
              <track
                key={`${track.lang}-${track.label}-${track.url}`}
                kind="subtitles"
                src={track.url}
                srcLang={track.lang}
                label={track.label}
                default={Boolean(track.isDefault)}
              />
            ))}
          </Video>
        )}
      </MinimalVideoSkin>
    </Player.Provider>
  );
}
