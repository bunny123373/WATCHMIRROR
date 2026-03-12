"use client";

import { createPlayer, Poster } from "@videojs/react";
import { VideoSkin, Video, videoFeatures } from "@videojs/react/video";
import "@videojs/react/video/skin.css";

const Player = createPlayer({ features: videoFeatures });

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  return (
    <Player.Provider>
      <VideoSkin>
        <Video src={src} playsInline />
        {poster && <Poster src={poster} />}
      </VideoSkin>
    </Player.Provider>
  );
}
