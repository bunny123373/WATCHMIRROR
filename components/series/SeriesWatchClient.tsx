"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Play, ChevronDown, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import StreamingPlayer from "@/components/players/StreamingPlayer";
import { Content } from "@/types/content";

export default function SeriesWatchClient({ content }: { content: Content }) {
  const router = useRouter();
  const now = Date.now();
  const seasons = useMemo(
    () =>
      (content.seasons || [])
        .map((season) => ({
          ...season,
          episodes: (season.episodes || []).filter((episode) => {
            if (!episode.releaseAt) return true;
            const ts = new Date(episode.releaseAt).getTime();
            return Number.isFinite(ts) ? ts <= now : true;
          })
        }))
        .filter((season) => season.episodes.length > 0),
    [content.seasons, now]
  );

  const [seasonNumber, setSeasonNumber] = useState(seasons[0]?.seasonNumber || 1);
  const [episodeNumber, setEpisodeNumber] = useState(seasons[0]?.episodes?.[0]?.episodeNumber || 1);
  const [autoNextActive, setAutoNextActive] = useState(false);
  const [countdown, setCountdown] = useState(15);

  const season = useMemo(() => seasons.find((item) => item.seasonNumber === seasonNumber), [seasons, seasonNumber]);
  const episode = useMemo(
    () => season?.episodes.find((item) => item.episodeNumber === episodeNumber) || season?.episodes[0],
    [season, episodeNumber]
  );

  const currentSeasonIndex = seasons.findIndex((s) => s.seasonNumber === seasonNumber);
  const currentEpisodeIndex = (season?.episodes || []).findIndex((e) => e.episodeNumber === episodeNumber);

  const prevEpisode = currentEpisodeIndex > 0 
    ? { season: seasonNumber, episode: season?.episodes[currentEpisodeIndex - 1]?.episodeNumber }
    : currentSeasonIndex > 0 && seasons[currentSeasonIndex - 1]
      ? { season: seasons[currentSeasonIndex - 1]?.seasonNumber, episode: seasons[currentSeasonIndex - 1]?.episodes.slice(-1)[0]?.episodeNumber }
      : null;

  const nextEpisode = currentEpisodeIndex < (season?.episodes.length || 0) - 1
    ? { season: seasonNumber, episode: season?.episodes[currentEpisodeIndex + 1]?.episodeNumber }
    : currentSeasonIndex < seasons.length - 1 && seasons[currentSeasonIndex + 1]
      ? { season: seasons[currentSeasonIndex + 1]?.seasonNumber, episode: seasons[currentSeasonIndex + 1]?.episodes[0]?.episodeNumber }
      : null;

  const goToPrev = () => {
    if (prevEpisode && prevEpisode.episode) {
      setSeasonNumber(prevEpisode.season);
      setEpisodeNumber(prevEpisode.episode);
    }
  };

  const goToNext = () => {
    if (nextEpisode && nextEpisode.episode) {
      setSeasonNumber(nextEpisode.season);
      setEpisodeNumber(nextEpisode.episode);
    }
  };

  useEffect(() => {
    setAutoNextActive(false);
    setCountdown(15);
  }, [seasonNumber, episodeNumber]);

  useEffect(() => {
    if (!autoNextActive || !nextEpisode?.episode) return;

    const timer = window.setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          goToNext();
          return 15;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [autoNextActive, nextEpisode?.episode]);

  const handleNearEndChange = ({ isNearEnd, remainingTime }: { isNearEnd: boolean; remainingTime: number; duration: number }) => {
    if (!nextEpisode?.episode) {
      setAutoNextActive(false);
      return;
    }

    if (isNearEnd) {
      setCountdown(Math.max(1, Math.min(15, Math.ceil(remainingTime))));
      setAutoNextActive(true);
      return;
    }

    setAutoNextActive(false);
    setCountdown(15);
  };

  const cancelAutoNext = () => {
    setAutoNextActive(false);
    setCountdown(15);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <StreamingPlayer
          type="series"
          slug={content.slug}
          title={`${content.title} - ${episode?.episodeTitle || "Episode " + episode?.episodeNumber}`}
          poster={content.poster}
          tmdbId={episode?.tmdbId || content.tmdbId}
          imdbId={episode?.imdbId || content.imdbId}
          hlsLink={episode?.hlsLink}
          embedIframeLink={episode?.embedIframeLink}
          backupHlsLink={episode?.backupHlsLink}
          backupEmbedIframeLink={episode?.backupEmbedIframeLink}
          subtitleTracks={episode?.subtitleTracks}
          videoSources={episode?.videoSources}
          seasonNumber={seasonNumber}
          episodeNumber={episode?.episodeNumber}
          introEnd={episode?.introEnd}
          outroStart={episode?.outroStart}
          onNearEndChange={handleNearEndChange}
          onEnded={() => {
            cancelAutoNext();
            goToNext();
          }}
        />

        {autoNextActive && nextEpisode?.episode && (
          <div className="pointer-events-none absolute bottom-16 right-4 z-30 max-w-xs rounded-2xl border border-white/10 bg-black/85 p-4 text-white shadow-2xl backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Up Next</p>
            <p className="mt-2 text-sm font-semibold">
              Season {nextEpisode.season}, Episode {nextEpisode.episode}
            </p>
            <p className="mt-1 text-xs text-gray-300">
              Playing next in {countdown}s
            </p>
            <div className="mt-3 flex gap-2 pointer-events-auto">
              <button
                onClick={cancelAutoNext}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  cancelAutoNext();
                  goToNext();
                }}
                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Play Now
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mx-4 rounded-xl bg-[#181818] border border-white/5 md:mx-8">
        <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">Season</p>
              <select
                value={seasonNumber}
                onChange={(e) => {
                  const newSeason = Number(e.target.value);
                  setSeasonNumber(newSeason);
                  const newSeasonData = seasons.find((s) => s.seasonNumber === newSeason);
                  setEpisodeNumber(newSeasonData?.episodes[0]?.episodeNumber || 1);
                }}
                className="rounded-lg bg-[#2a2a2a] px-3 py-2 text-white border border-white/10 cursor-pointer"
              >
                {seasons.map((s) => (
                  <option key={s.seasonNumber} value={s.seasonNumber}>
                    Season {s.seasonNumber}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Episode</p>
              <select
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                className="rounded-lg bg-[#2a2a2a] px-3 py-2 text-white border border-white/10 cursor-pointer"
              >
                {season?.episodes.map((ep) => (
                  <option key={ep.episodeNumber} value={ep.episodeNumber}>
                    Ep {ep.episodeNumber}: {ep.episodeTitle || "Episode " + ep.episodeNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPrev}
              disabled={!prevEpisode}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm ${
                prevEpisode ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/5 text-gray-600 cursor-not-allowed"
              }`}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              onClick={goToNext}
              disabled={!nextEpisode}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm ${
                nextEpisode ? "bg-red-600 text-white hover:bg-red-700" : "bg-white/5 text-gray-600 cursor-not-allowed"
              }`}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="border-t border-white/5">
          <div className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Episodes - Season {seasonNumber}</h3>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {(season?.episodes || []).map((ep) => (
                <button
                  key={ep.episodeNumber}
                  onClick={() => setEpisodeNumber(ep.episodeNumber)}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                    ep.episodeNumber === episode?.episodeNumber
                      ? "border-red-500 bg-red-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                    ep.episodeNumber === episode?.episodeNumber
                      ? "bg-red-600 text-white"
                      : "bg-white/10 text-gray-400"
                  }`}>
                    {ep.episodeNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      ep.episodeNumber === episode?.episodeNumber ? "text-red-500" : "text-white"
                    }`}>
                      {ep.episodeTitle || `Episode ${ep.episodeNumber}`}
                    </p>
                    {ep.quality && (
                      <span className="inline-block rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white mt-1">
                        {ep.quality}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
