"use client";

import { useState, useRef } from "react";
import DPlayer, { DPlayerRef } from "@/components/players/DPlayer";

export default function DPlayerDemo() {
  const playerRef = useRef<DPlayerRef>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="mb-6 text-2xl font-bold text-white">DPlayer Demo</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => playerRef.current?.play()}
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Play
        </button>
        <button
          onClick={() => playerRef.current?.pause()}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Pause
        </button>
        <button
          onClick={() => playerRef.current?.seek(30)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Seek 30s
        </button>
        <button
          onClick={() => playerRef.current?.volume(0.5)}
          className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          Volume 50%
        </button>
      </div>

      <DPlayer
        ref={playerRef}
        videoUrl="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        videoPic="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/800px-Camponotus_flavomarginatus_ant.jpg"
        subtitleTracks={[
          { label: "English", url: "https://example.com/subtitles/en.vtt" },
          { label: "Spanish", url: "https://example.com/subtitles/es.vtt" },
        ]}
        danmakuId="demo"
        danmakuApi="https://api.prprpr.me/dplayer/"
        screenshot
        autoplay={false}
        loop={false}
        lang="en"
        hotkey={true}
        preload="auto"
        volume={0.7}
        dark={false}
        initialTime={0}
        playbackRate={playbackRate}
        onReady={() => console.log("Player ready")}
        onPlay={() => console.log("Playing")}
        onPause={() => console.log("Paused")}
        onEnded={() => console.log("Ended")}
        onVolumeChange={(vol) => console.log("Volume:", vol)}
        onTimeUpdate={(time) => console.log("Time:", time)}
      />

      <div className="mt-4">
        <label className="text-white">
          Playback Speed:
          <select
            value={playbackRate}
            onChange={(e) => {
              const rate = Number(e.target.value);
              setPlaybackRate(rate);
              playerRef.current?.speed(rate);
            }}
            className="ml-2 rounded bg-[#2a2a2a] px-2 py-1 text-white"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={1.75}>1.75x</option>
            <option value={2}>2x</option>
          </select>
        </label>
      </div>
    </div>
  );
}
