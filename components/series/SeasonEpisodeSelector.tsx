"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronDown, Calendar } from "lucide-react";
import { Season } from "@/types/content";

interface SeasonEpisodeSelectorProps {
  seasons: Season[];
  seriesSlug: string;
}

export default function SeasonEpisodeSelector({ seasons, seriesSlug }: SeasonEpisodeSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]?.seasonNumber || 1);
  const [isSeasonOpen, setIsSeasonOpen] = useState(false);

  const currentSeason = useMemo(
    () => seasons.find((s) => s.seasonNumber === selectedSeason),
    [seasons, selectedSeason]
  );

  if (!currentSeason) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <button
            onClick={() => setIsSeasonOpen(!isSeasonOpen)}
            className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] border border-white/10 px-4 py-2.5 text-white hover:bg-[#2a2a2a] transition"
          >
            <span className="font-medium">Season {selectedSeason}</span>
            <ChevronDown size={16} className={`transition ${isSeasonOpen ? "rotate-180" : ""}`} />
          </button>
          
          {isSeasonOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 rounded-lg bg-[#1a1a1a] border border-white/10 py-2 shadow-xl z-20 max-h-64 overflow-y-auto">
              {seasons.map((season) => (
                <button
                  key={season.seasonNumber}
                  onClick={() => {
                    setSelectedSeason(season.seasonNumber);
                    setIsSeasonOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition ${
                    season.seasonNumber === selectedSeason ? "text-red-500" : "text-white"
                  }`}
                >
                  Season {season.seasonNumber}
                  <span className="ml-2 text-gray-500 text-xs">({season.episodes.length} eps)</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <Link
          href={`/series/watch/${seriesSlug}?season=${selectedSeason}`}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-white font-medium hover:bg-red-700 transition"
        >
          <Play size={16} fill="white" />
          Play Season {selectedSeason}
        </Link>
      </div>

      <div className="rounded-xl bg-[#1a1a1a] border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <span className="text-sm text-gray-400">Episodes</span>
          <span className="text-sm text-gray-500">{currentSeason.episodes.length} episodes</span>
        </div>
        
        <div className="divide-y divide-white/5">
          {currentSeason.episodes.map((episode) => (
            <Link
              key={episode.episodeNumber}
              href={`/series/watch/${seriesSlug}?season=${selectedSeason}&episode=${episode.episodeNumber}`}
              className="flex items-start gap-4 p-4 hover:bg-white/5 transition group"
            >
              <div className="relative flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden bg-[#2a2a2a]">
                {episode.hlsLink || episode.embedIframeLink ? (
                  <div className="flex h-full w-full items-center justify-center bg-[#2a2a2a]">
                    <Play size={20} className="text-gray-500" />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Play size={20} className="text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                    <Play size={16} fill="white" className="text-white" />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">
                    Episode {episode.episodeNumber}
                  </span>
                  {episode.quality && (
                    <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {episode.quality}
                    </span>
                  )}
                </div>
                <h4 className="text-sm text-gray-300 font-medium truncate mb-1">
                  {episode.episodeTitle || `Episode ${episode.episodeNumber}`}
                </h4>
                {episode.releaseAt && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(episode.releaseAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
