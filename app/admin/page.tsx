"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Content, ContentType, Season, SubtitleTrack } from "@/types/content";

const emptyPayload: Partial<Content> = {
  type: "movie",
  title: "",
  poster: "",
  banner: "",
  description: "",
  year: new Date().getFullYear(),
  language: "EN",
  category: "Latest",
  quality: "HD",
  rating: 0,
  tags: [],
  popularity: 0,
  trailerEmbedUrl: "",
  cast: [],
  hlsLink: "",
  embedIframeLink: "",
  backupHlsLink: "",
  backupEmbedIframeLink: "",
  subtitleTracks: [],
  publishAt: "",
  seasons: []
};

const parseSubtitleLines = (raw: string): SubtitleTrack[] =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [lang = "", label = "", url = "", defaultFlag = ""] = line.split("|").map((item) => item.trim());
      return {
        lang: lang || "en",
        label: label || "Subtitle",
        url,
        isDefault: defaultFlag.toLowerCase() === "default"
      };
    })
    .filter((track) => Boolean(track.url));

const subtitleLines = (tracks?: SubtitleTrack[]) =>
  (tracks || [])
    .map((track) => `${track.lang}|${track.label}|${track.url}${track.isDefault ? "|default" : ""}`)
    .join("\n");

const createEpisode = (episodeNumber: number) => ({
  episodeNumber,
  episodeTitle: `Episode ${episodeNumber}`,
  hlsLink: "",
  embedIframeLink: "",
  backupHlsLink: "",
  backupEmbedIframeLink: "",
  subtitleTracks: [],
  releaseAt: "",
  quality: "HD"
});

const createSeason = (seasonNumber: number): Season => ({
  seasonNumber,
  episodes: [createEpisode(1)]
});

export default function AdminPage() {
  const [mode, setMode] = useState<ContentType>("movie");
  const [adminKey, setAdminKey] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<Partial<Content>>(emptyPayload);
  const [seasonsDraft, setSeasonsDraft] = useState<Season[]>([createSeason(1)]);
  const [movieSubtitlesInput, setMovieSubtitlesInput] = useState("");
  const [items, setItems] = useState<Content[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [contentSearch, setContentSearch] = useState("");
  const [contentPage, setContentPage] = useState(1);
  const itemsPerPage = 20;

  const slugPreview = useMemo(() => {
    return (payload.title || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }, [payload.title]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => item.type === mode);
  }, [items, mode]);

  const searchedItems = useMemo(() => {
    if (!contentSearch.trim()) return filteredItems;
    const term = contentSearch.toLowerCase();
    return filteredItems.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.language?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term)
    );
  }, [filteredItems, contentSearch]);

  const paginatedItems = useMemo(() => {
    const start = (contentPage - 1) * itemsPerPage;
    return searchedItems.slice(start, start + itemsPerPage);
  }, [searchedItems, contentPage]);

  const totalPages = Math.ceil(searchedItems.length / itemsPerPage);

  const searchResults = useMemo(() => {
    const expected = mode === "movie" ? "movie" : "tv";
    return tmdbResults.filter((item) => item.mediaType === expected);
  }, [tmdbResults, mode]);

  const analytics = useMemo(() => {
    const total = items.length;
    const movies = items.filter((item) => item.type === "movie").length;
    const series = total - movies;
    const avgRating = total ? (items.reduce((acc, item) => acc + (item.rating || 0), 0) / total).toFixed(1) : "0.0";
    const scheduled = items.filter((item) => item.publishAt && new Date(item.publishAt).getTime() > Date.now()).length;

    const languageCounts = items.reduce((acc: Record<string, number>, item) => {
      const key = item.language || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const topLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const categoryCounts = items.reduce((acc: Record<string, number>, item) => {
      const key = item.category || "Other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { total, movies, series, avgRating, scheduled, topLanguages, topCategories };
  }, [items]);

  const applyMode = (nextMode: ContentType) => {
    setMode(nextMode);
    setPayload((prev) => ({
      ...prev,
      type: nextMode
    }));
  };

  const loadContent = async () => {
    const res = await fetch("/api/admin/content", {
      method: "GET",
      headers: {
        "x-admin-key": adminKey
      }
    });

    if (!res.ok) {
      return;
    }

    const data = await res.json();
    setItems(Array.isArray(data.items) ? data.items : []);
  };

  const searchTMDB = async () => {
    if (!tmdbQuery.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(tmdbQuery)}`);
    const data = await res.json();
    setTmdbResults(data.results || []);
    setLoading(false);
  };

  const importTMDB = async (id: number, mediaType: "movie" | "tv") => {
    setLoading(true);
    const res = await fetch(`/api/tmdb/details/${id}?mediaType=${mediaType}`);
    const data = await res.json();
    const nextType: ContentType = mediaType === "movie" ? "movie" : "series";
    const details = data.details || {};

    applyMode(nextType);
    setPayload((prev) => ({ ...prev, ...details, type: nextType }));
    setMovieSubtitlesInput(subtitleLines((details.subtitleTracks || []) as SubtitleTrack[]));
    if (nextType === "series") {
      const importedSeasons = Array.isArray(details.seasons) && details.seasons.length ? (details.seasons as Season[]) : [createSeason(1)];
      setSeasonsDraft(importedSeasons);
    }
    setLoading(false);
  };

  const startEdit = (item: Content) => {
    setEditingId(item._id || null);
    applyMode(item.type);
    setPayload({
      ...item,
      type: item.type
    });
    setMovieSubtitlesInput(subtitleLines(item.subtitleTracks));
    setSeasonsDraft(item.seasons && item.seasons.length ? item.seasons : [createSeason(1)]);
    setStatus(`Editing: ${item.title}`);
  };

  const resetForm = () => {
    setEditingId(null);
    setPayload({ ...emptyPayload, type: mode });
    setSeasonsDraft([createSeason(1)]);
    setMovieSubtitlesInput("");
  };

  const addSeason = () => {
    setSeasonsDraft((prev) => [...prev, createSeason(prev.length + 1)]);
  };

  const removeSeason = (seasonIndex: number) => {
    setSeasonsDraft((prev) => prev.filter((_, idx) => idx !== seasonIndex).map((season, idx) => ({ ...season, seasonNumber: idx + 1 })));
  };

  const updateSeasonField = (seasonIndex: number, value: number) => {
    setSeasonsDraft((prev) => prev.map((season, idx) => (idx === seasonIndex ? { ...season, seasonNumber: value } : season)));
  };

  const addEpisode = (seasonIndex: number) => {
    setSeasonsDraft((prev) =>
      prev.map((season, idx) =>
        idx === seasonIndex ? { ...season, episodes: [...season.episodes, createEpisode(season.episodes.length + 1)] } : season
      )
    );
  };

  const removeEpisode = (seasonIndex: number, episodeIndex: number) => {
    setSeasonsDraft((prev) =>
      prev.map((season, idx) => {
        if (idx !== seasonIndex) return season;
        const episodes = season.episodes.filter((_, epIdx) => epIdx !== episodeIndex).map((ep, epIdx) => ({ ...ep, episodeNumber: epIdx + 1 }));
        return { ...season, episodes: episodes.length ? episodes : [createEpisode(1)] };
      })
    );
  };

  const updateEpisodeField = (
    seasonIndex: number,
    episodeIndex: number,
    field:
      | "episodeNumber"
      | "episodeTitle"
      | "hlsLink"
      | "embedIframeLink"
      | "backupHlsLink"
      | "backupEmbedIframeLink"
      | "quality"
      | "releaseAt",
    value: string
  ) => {
    setSeasonsDraft((prev) =>
      prev.map((season, sIdx) => {
        if (sIdx !== seasonIndex) return season;
        const episodes = season.episodes.map((episode, eIdx) => {
          if (eIdx !== episodeIndex) return episode;
          if (field === "episodeNumber") {
            return { ...episode, episodeNumber: Number(value) || episode.episodeNumber };
          }
          return { ...episode, [field]: value };
        });
        return { ...season, episodes };
      })
    );
  };

  const updateEpisodeSubtitles = (seasonIndex: number, episodeIndex: number, value: string) => {
    setSeasonsDraft((prev) =>
      prev.map((season, sIdx) => {
        if (sIdx !== seasonIndex) return season;
        const episodes = season.episodes.map((episode, eIdx) =>
          eIdx === episodeIndex ? { ...episode, subtitleTracks: parseSubtitleLines(value) } : episode
        );
        return { ...season, episodes };
      })
    );
  };

  const submitContent = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("Saving...");

    const parsedSeasons: Season[] =
      mode === "series"
        ? seasonsDraft.map((season, seasonIndex) => ({
            seasonNumber: Number(season.seasonNumber) || seasonIndex + 1,
            episodes: (season.episodes || []).map((episode, episodeIndex) => ({
              episodeNumber: Number(episode.episodeNumber) || episodeIndex + 1,
              episodeTitle: (episode.episodeTitle || `Episode ${episodeIndex + 1}`).trim(),
              hlsLink: episode.hlsLink || "",
              embedIframeLink: episode.embedIframeLink || "",
              backupHlsLink: episode.backupHlsLink || "",
              backupEmbedIframeLink: episode.backupEmbedIframeLink || "",
              subtitleTracks: episode.subtitleTracks || [],
              releaseAt: episode.releaseAt || "",
              quality: episode.quality || "HD"
            }))
          }))
        : [];

    const isEditing = Boolean(editingId);
    const res = await fetch("/api/admin/content", {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey
      },
      body: JSON.stringify({
        ...payload,
        _id: editingId || undefined,
        type: mode,
        seasons: mode === "series" ? parsedSeasons : [],
        hlsLink: mode === "movie" ? payload.hlsLink : "",
        embedIframeLink: mode === "movie" ? payload.embedIframeLink : "",
        backupHlsLink: mode === "movie" ? payload.backupHlsLink : "",
        backupEmbedIframeLink: mode === "movie" ? payload.backupEmbedIframeLink : "",
        subtitleTracks: mode === "movie" ? parseSubtitleLines(movieSubtitlesInput) : [],
        publishAt: payload.publishAt || null,
        tags: Array.isArray(payload.tags)
          ? payload.tags
          : String(payload.tags || "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
      })
    });

    if (!res.ok) {
      const err = await res.json();
      setStatus(err.error || "Failed to save");
      return;
    }

    resetForm();
    await loadContent();
    setStatus(isEditing ? "Content updated successfully." : "Content saved successfully.");
  };

  const deleteContent = async (id?: string) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this content item? This action cannot be undone.");
    if (!confirmed) return;

    setStatus("Deleting...");
    const res = await fetch(`/api/admin/content?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "x-admin-key": adminKey
      }
    });

    if (!res.ok) {
      const err = await res.json();
      setStatus(err.error || "Failed to delete");
      return;
    }

    if (editingId === id) {
      resetForm();
    }
    await loadContent();
    setStatus("Content deleted successfully.");
  };

  const duplicateContent = (item: Content) => {
    applyMode(item.type);
    setPayload({
      ...item,
      title: `${item.title} (Copy)`,
      _id: undefined,
      slug: undefined
    });
    setMovieSubtitlesInput(subtitleLines(item.subtitleTracks));
    setSeasonsDraft(item.seasons && item.seasons.length ? item.seasons : [createSeason(1)]);
    setEditingId(null);
    setStatus(`Duplicated: ${item.title}`);
  };

  const unlockAdmin = async () => {
    setStatus("Validating key...");
    const res = await fetch("/api/admin/content", {
      method: "GET",
      headers: {
        "x-admin-key": adminKey
      }
    });

    if (!res.ok) {
      setStatus("Invalid admin key.");
      setAuthorized(false);
      return;
    }

    setAuthorized(true);
    setStatus("");
    await loadContent();
  };

  if (!authorized) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6">
        <h1 className="font-[var(--font-heading)] text-2xl">WATCHMIRROR Admin Panel</h1>
        <p className="mt-2 text-sm text-muted">Enter admin key to access content manager.</p>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          className="mt-4 w-full rounded-xl border border-border bg-black/20 px-4 py-3 text-sm outline-none"
          placeholder="Admin key"
        />
        <button
          onClick={unlockAdmin}
          className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-black"
        >
          Unlock
        </button>
        {status && <p className="mt-2 text-xs text-muted">{status}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-[var(--font-heading)] text-3xl">WATCHMIRROR Admin Panel</h1>

      <section className="grid gap-3 md:grid-cols-5">
        <div className="glass rounded-xl p-3">
          <p className="text-xs uppercase tracking-wider text-muted">Total</p>
          <p className="mt-1 text-2xl font-bold text-primary">{analytics.total}</p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-xs uppercase tracking-wider text-muted">Movies</p>
          <p className="mt-1 text-2xl font-bold text-primary">{analytics.movies}</p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-xs uppercase tracking-wider text-muted">Series</p>
          <p className="mt-1 text-2xl font-bold text-primary">{analytics.series}</p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-xs uppercase tracking-wider text-muted">Avg Rating</p>
          <p className="mt-1 text-2xl font-bold text-primary">{analytics.avgRating}</p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-xs uppercase tracking-wider text-muted">Scheduled</p>
          <p className="mt-1 text-2xl font-bold text-primary">{analytics.scheduled}</p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="glass rounded-xl p-4">
          <h2 className="mb-2 text-sm font-semibold">Top Languages</h2>
          <div className="space-y-2">
            {analytics.topLanguages.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>{name}</span>
                <span className="text-muted">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <h2 className="mb-2 text-sm font-semibold">Top Categories</h2>
          <div className="space-y-2">
            {analytics.topCategories.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>{name}</span>
                <span className="text-muted">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass flex gap-2 rounded-2xl p-2">
        <button
          type="button"
          onClick={() => applyMode("movie")}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${mode === "movie" ? "bg-primary text-black" : "border border-border"}`}
        >
          Movies
        </button>
        <button
          type="button"
          onClick={() => applyMode("series")}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${mode === "series" ? "bg-primary text-black" : "border border-border"}`}
        >
          Series
        </button>
      </section>

      <section className="glass rounded-2xl p-4">
        <h2 className="mb-3 text-lg font-semibold">TMDB Auto Import ({mode === "movie" ? "Movies" : "Series"})</h2>
        <div className="flex gap-2">
          <input
            value={tmdbQuery}
            onChange={(e) => setTmdbQuery(e.target.value)}
            placeholder={mode === "movie" ? "Search movie" : "Search series"}
            className="flex-1 rounded-xl border border-border bg-black/20 px-4 py-2 text-sm"
          />
          <button onClick={searchTMDB} className="rounded-xl border border-border px-4 py-2 text-sm">
            <Search size={16} />
          </button>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {searchResults.map((item) => (
            <button
              key={`${item.mediaType}-${item.id}`}
              onClick={() => importTMDB(item.id, item.mediaType)}
              className="flex gap-3 rounded-xl border border-border p-3 text-left hover:border-primary"
            >
              {item.poster ? (
                <Image src={item.poster} alt={item.title} width={56} height={80} className="h-20 w-14 rounded-md object-cover" />
              ) : (
                <div className="h-20 w-14 rounded-md bg-black/30" />
              )}
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-muted">{item.mediaType.toUpperCase()} | {item.year || "-"}</p>
              </div>
            </button>
          ))}
        </div>
        {loading && <p className="mt-2 text-xs text-muted">Loading...</p>}
      </section>

      <form onSubmit={submitContent} className="glass grid gap-4 rounded-2xl p-4 md:grid-cols-2">
        <input value={payload.title || ""} onChange={(e) => setPayload({ ...payload, title: e.target.value })} placeholder="Title" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" required />
        <select value={mode} onChange={(e) => applyMode(e.target.value as "movie" | "series")} className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm">
          <option value="movie">Movie</option>
          <option value="series">Series</option>
        </select>
        <input value={payload.poster || ""} onChange={(e) => setPayload({ ...payload, poster: e.target.value })} placeholder="Poster URL" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" required />
        <div className="relative h-48 w-32 overflow-hidden rounded-lg border border-border md:col-span-2 lg:col-span-1">
          {payload.poster ? (
            <Image src={payload.poster} alt="Poster preview" fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted">Poster preview</div>
          )}
        </div>
        <input value={payload.banner || ""} onChange={(e) => setPayload({ ...payload, banner: e.target.value })} placeholder="Banner URL" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" required />
        <input value={String(payload.year || "")} onChange={(e) => setPayload({ ...payload, year: Number(e.target.value) })} placeholder="Year" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" required />
        <input
          type="datetime-local"
          value={payload.publishAt ? new Date(payload.publishAt).toISOString().slice(0, 16) : ""}
          onChange={(e) => setPayload({ ...payload, publishAt: e.target.value ? new Date(e.target.value).toISOString() : "" })}
          className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm"
        />
        <input value={payload.language || ""} onChange={(e) => setPayload({ ...payload, language: e.target.value })} placeholder="Language" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
        <input value={payload.category || ""} onChange={(e) => setPayload({ ...payload, category: e.target.value })} placeholder="Category" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
        <input value={payload.quality || ""} onChange={(e) => setPayload({ ...payload, quality: e.target.value })} placeholder="Quality" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
        <input value={String(payload.rating || 0)} onChange={(e) => setPayload({ ...payload, rating: Number(e.target.value) })} placeholder="Rating" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
        <input value={String(payload.popularity || 0)} onChange={(e) => setPayload({ ...payload, popularity: Number(e.target.value) })} placeholder="Popularity" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
        {mode === "movie" ? (
          <>
            <input value={payload.hlsLink || ""} onChange={(e) => setPayload({ ...payload, hlsLink: e.target.value })} placeholder="HLS Link" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
            <input value={payload.embedIframeLink || ""} onChange={(e) => setPayload({ ...payload, embedIframeLink: e.target.value })} placeholder="Embed Iframe Link" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
            <input value={payload.backupHlsLink || ""} onChange={(e) => setPayload({ ...payload, backupHlsLink: e.target.value })} placeholder="Backup HLS Link" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
            <input value={payload.backupEmbedIframeLink || ""} onChange={(e) => setPayload({ ...payload, backupEmbedIframeLink: e.target.value })} placeholder="Backup Embed Link" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
            <textarea
              value={movieSubtitlesInput}
              onChange={(e) => setMovieSubtitlesInput(e.target.value)}
              placeholder="Subtitles: lang|label|url|default (one per line)"
              className="min-h-[90px] rounded-xl border border-border bg-black/20 px-4 py-2 text-sm md:col-span-2"
            />
          </>
        ) : (
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Seasons & Episodes</p>
              <button type="button" onClick={addSeason} className="rounded-lg border border-border px-3 py-1 text-xs hover:border-primary">
                Add Season
              </button>
            </div>
            {seasonsDraft.map((season, seasonIndex) => (
              <div key={`season-${seasonIndex}`} className="space-y-2 rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={season.seasonNumber}
                    onChange={(e) => updateSeasonField(seasonIndex, Number(e.target.value) || season.seasonNumber)}
                    className="w-24 rounded-lg border border-border bg-black/20 px-3 py-1 text-sm"
                  />
                  <button type="button" onClick={() => addEpisode(seasonIndex)} className="rounded-lg border border-border px-2 py-1 text-xs hover:border-primary">
                    Add Episode
                  </button>
                  <button type="button" onClick={() => removeSeason(seasonIndex)} className="rounded-lg border border-border px-2 py-1 text-xs text-red-300 hover:border-red-400">
                    Remove Season
                  </button>
                </div>
                {season.episodes.map((episode, episodeIndex) => (
                  <div key={`episode-${seasonIndex}-${episodeIndex}`} className="grid gap-2 rounded-lg border border-border/60 p-2 md:grid-cols-2">
                    <input
                      type="number"
                      min={1}
                      value={episode.episodeNumber}
                      onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "episodeNumber", e.target.value)}
                      placeholder="Episode #"
                      className="rounded-lg border border-border bg-black/20 px-3 py-2 text-sm"
                    />
                    <input
                      value={episode.episodeTitle}
                      onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "episodeTitle", e.target.value)}
                      placeholder="Episode title"
                      className="rounded-lg border border-border bg-black/20 px-3 py-2 text-sm"
                    />
                    <input
                      value={episode.hlsLink || ""}
                      onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "hlsLink", e.target.value)}
                      placeholder="Episode HLS link"
                      className="rounded-lg border border-border bg-black/20 px-3 py-2 text-sm"
                    />
                    <input
                      value={episode.embedIframeLink || ""}
                      onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "embedIframeLink", e.target.value)}
                      placeholder="Episode iframe link"
                      className="rounded-lg border border-border bg-black/20 px-3 py-2 text-sm"
                    />
                    <input
                      value={episode.backupHlsLink || ""}
                      onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "backupHlsLink", e.target.value)}
                      placeholder="Episode backup HLS link"
                      className="rounded-lg border border-border bg-black/20 px-3 py-2 text-sm"
                    />
                    <input
                      value={episode.backupEmbedIframeLink || ""}
                      onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "backupEmbedIframeLink", e.target.value)}
                      placeholder="Episode backup iframe link"
                      className="rounded-lg border border-border bg-black/20 px-3 py-2 text-sm"
                    />
                    <input
                      value={episode.quality || "HD"}
                      onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "quality", e.target.value)}
                      placeholder="Quality"
                      className="rounded-lg border border-border bg-black/20 px-3 py-2 text-sm"
                    />
                    <input
                      type="datetime-local"
                      value={episode.releaseAt ? new Date(episode.releaseAt).toISOString().slice(0, 16) : ""}
                      onChange={(e) =>
                        updateEpisodeField(seasonIndex, episodeIndex, "releaseAt", e.target.value ? new Date(e.target.value).toISOString() : "")
                      }
                      className="rounded-lg border border-border bg-black/20 px-3 py-2 text-sm"
                    />
                    <textarea
                      value={subtitleLines(episode.subtitleTracks)}
                      onChange={(e) => updateEpisodeSubtitles(seasonIndex, episodeIndex, e.target.value)}
                      placeholder="Episode subtitles: lang|label|url|default"
                      className="min-h-[70px] rounded-lg border border-border bg-black/20 px-3 py-2 text-sm md:col-span-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeEpisode(seasonIndex, episodeIndex)}
                      className="rounded-lg border border-border px-3 py-2 text-xs text-red-300 hover:border-red-400"
                    >
                      Remove Episode
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <input value={payload.trailerEmbedUrl || ""} onChange={(e) => setPayload({ ...payload, trailerEmbedUrl: e.target.value })} placeholder="Trailer Embed URL" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm md:col-span-2" />
        <input
          value={Array.isArray(payload.tags) ? payload.tags.join(", ") : ""}
          onChange={(e) => setPayload({ ...payload, tags: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
          placeholder="Tags (comma separated)"
          className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm md:col-span-2"
        />
        <textarea value={payload.description || ""} onChange={(e) => setPayload({ ...payload, description: e.target.value })} placeholder="Description" className="min-h-[120px] rounded-xl border border-border bg-black/20 px-4 py-2 text-sm md:col-span-2" required />

        <p className="text-xs text-muted md:col-span-2">Slug preview: {slugPreview || "-"}</p>

        <div className="flex gap-2 md:col-span-2">
          <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-black">
            <Plus size={16} /> {editingId ? "Update" : "Save"} {mode === "movie" ? "Movie" : "Series"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setStatus("Edit cancelled.");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm"
            >
              <X size={16} /> Cancel
            </button>
          )}
        </div>
        <p className="text-sm text-muted md:col-span-2">{status}</p>
      </form>

      <section className="glass rounded-2xl p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">{mode === "movie" ? "Movies" : "Series"} ({searchedItems.length})</h2>
          <input
            value={contentSearch}
            onChange={(e) => {
              setContentSearch(e.target.value);
              setContentPage(1);
            }}
            placeholder="Search content..."
            className="rounded-lg border border-border bg-black/20 px-3 py-1.5 text-sm sm:w-64"
          />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {paginatedItems.map((item) => (
            <div key={item._id || item.slug} className="flex gap-3 rounded-xl border border-border p-3">
              {item.poster ? (
                <Image src={item.poster} alt={item.title} width={56} height={80} className="h-20 w-14 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="h-20 w-14 shrink-0 rounded-md bg-black/30" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{item.title}</p>
                <p className="text-xs text-muted">
                  {item.year} | {item.language} | {item.rating?.toFixed(1) || "N/A"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:border-primary"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateContent(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:border-primary"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteContent(item._id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-red-300 hover:border-red-400"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setContentPage((p) => Math.max(1, p - 1))}
              disabled={contentPage === 1}
              className="rounded-lg border border-border px-3 py-1 text-xs disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs text-muted">
              Page {contentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setContentPage((p) => Math.min(totalPages, p + 1))}
              disabled={contentPage === totalPages}
              className="rounded-lg border border-border px-3 py-1 text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
