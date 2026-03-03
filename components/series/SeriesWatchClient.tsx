"use client";

import { useMemo, useState } from "react";
import StreamingPlayer from "@/components/players/StreamingPlayer";
import { Content } from "@/types/content";

export default function SeriesWatchClient({ content }: { content: Content }) {
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

  const season = useMemo(() => seasons.find((item) => item.seasonNumber === seasonNumber), [seasons, seasonNumber]);
  const episode = useMemo(
    () => season?.episodes.find((item) => item.episodeNumber === episodeNumber) || season?.episodes[0],
    [season, episodeNumber]
  );

  return (
    <div className="space-y-6">
      <StreamingPlayer
        type="series"
        slug={content.slug}
        title={`${content.title} - ${episode?.episodeTitle || "Episode"}`}
        poster={content.poster}
        hlsLink={episode?.hlsLink}
        embedIframeLink={episode?.embedIframeLink}
        backupHlsLink={episode?.backupHlsLink}
        backupEmbedIframeLink={episode?.backupEmbedIframeLink}
        subtitleTracks={episode?.subtitleTracks}
        seasonNumber={seasonNumber}
        episodeNumber={episode?.episodeNumber}
      />

      <div className="grid gap-4 md:grid-cols-[220px,1fr]">
        <div className="glass rounded-2xl p-4">
          <h3 className="mb-3 text-sm font-semibold text-primary">Seasons</h3>
          <div className="space-y-2">
            {seasons.map((s) => (
              <button
                key={s.seasonNumber}
                onClick={() => {
                  setSeasonNumber(s.seasonNumber);
                  setEpisodeNumber(s.episodes[0]?.episodeNumber || 1);
                }}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                  s.seasonNumber === seasonNumber ? "border-primary text-primary" : "border-border text-muted"
                }`}
              >
                Season {s.seasonNumber}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h3 className="mb-3 text-sm font-semibold text-primary">Episodes</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {(season?.episodes || []).map((ep) => (
              <button
                key={ep.episodeNumber}
                onClick={() => setEpisodeNumber(ep.episodeNumber)}
                className={`rounded-xl border p-3 text-left ${
                  ep.episodeNumber === episode?.episodeNumber ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <p className="text-xs text-muted">Episode {ep.episodeNumber}</p>
                <p className="text-sm font-semibold">{ep.episodeTitle}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
