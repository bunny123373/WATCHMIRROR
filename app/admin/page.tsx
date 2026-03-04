"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Search, Trash2, X, Film, Tv, BarChart3, Clock, Star, Globe, Tag, Lock } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"browse" | "add" | "import">("browse");
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
    setActiveTab("add");
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
    setActiveTab("add");
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
    setActiveTab("add");
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-[var(--font-heading)] text-3xl text-white">Admin Panel</h1>
            <p className="mt-2 text-gray-400">Enter your admin key to continue</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlockAdmin()}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Enter admin key"
              autoFocus
            />
            <button
              onClick={unlockAdmin}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-black transition hover:bg-primary/90"
            >
              Access Dashboard
            </button>
            {status && <p className="mt-3 text-center text-sm text-red-400">{status}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-[var(--font-heading)] text-3xl text-white">Dashboard</h1>
        <div className="flex gap-2">
          {(["browse", "add", "import"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab ? "bg-primary text-black" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab === "browse" && "Browse"}
              {tab === "add" && (editingId ? "Edit Content" : "Add New")}
              {tab === "import" && "TMDB Import"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2">
              <Film className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Content</p>
              <p className="text-2xl font-bold text-white">{analytics.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/20 p-2">
              <Film className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Movies</p>
              <p className="text-2xl font-bold text-white">{analytics.movies}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/20 p-2">
              <Tv className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Series</p>
              <p className="text-2xl font-bold text-white">{analytics.series}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/20 p-2">
              <Star className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Avg Rating</p>
              <p className="text-2xl font-bold text-white">{analytics.avgRating}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/20 p-2">
              <Clock className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Scheduled</p>
              <p className="text-2xl font-bold text-white">{analytics.scheduled}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-medium text-white">Top Languages</h3>
          </div>
          <div className="space-y-2">
            {analytics.topLanguages.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2">
                <span className="text-sm text-gray-300">{name}</span>
                <span className="text-sm font-medium text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-medium text-white">Top Categories</h3>
          </div>
          <div className="space-y-2">
            {analytics.topCategories.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2">
                <span className="text-sm text-gray-300">{name}</span>
                <span className="text-sm font-medium text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "browse" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => applyMode("movie")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${mode === "movie" ? "bg-primary text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
              >
                Movies ({analytics.movies})
              </button>
              <button
                onClick={() => applyMode("series")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${mode === "series" ? "bg-primary text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
              >
                Series ({analytics.series})
              </button>
            </div>
            <input
              value={contentSearch}
              onChange={(e) => {
                setContentSearch(e.target.value);
                setContentPage(1);
              }}
              placeholder="Search content..."
              className="rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedItems.map((item) => (
              <div key={item._id || item.slug} className="group relative rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-white/20">
                <div className="flex gap-3">
                  {item.poster ? (
                    <Image src={item.poster} alt={item.title} width={80} height={110} className="h-[110px] w-[80px] rounded-lg object-cover" />
                  ) : (
                    <div className="h-[110px] w-[80px] rounded-lg bg-black/30" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-400">{item.year} · {item.language} · {item.rating?.toFixed(1)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => duplicateContent(item)}
                        className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => deleteContent(item._id)}
                        className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setContentPage((p) => Math.max(1, p - 1))}
                disabled={contentPage === 1}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-gray-400">Page {contentPage} of {totalPages}</span>
              <button
                onClick={() => setContentPage((p) => Math.min(totalPages, p + 1))}
                disabled={contentPage === totalPages}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "add" && (
        <form onSubmit={submitContent} className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input value={payload.title || ""} onChange={(e) => setPayload({ ...payload, title: e.target.value })} placeholder="Title *" className="rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary" required />
            <div className="flex gap-2">
              <select value={mode} onChange={(e) => applyMode(e.target.value as "movie" | "series")} className="rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-primary">
                <option value="movie">Movie</option>
                <option value="series">Series</option>
              </select>
              <select value={payload.language || ""} onChange={(e) => setPayload({ ...payload, language: e.target.value })} className="flex-1 rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-primary">
                <option value="EN">English</option>
                <option value="TE">Telugu</option>
                <option value="HI">Hindi</option>
                <option value="TA">Tamil</option>
                <option value="ML">Malayalam</option>
                <option value="KN">Kannada</option>
                <option value="KO">Korean</option>
                <option value="JA">Japanese</option>
                <option value="ES">Spanish</option>
              </select>
            </div>
            <input value={payload.poster || ""} onChange={(e) => setPayload({ ...payload, poster: e.target.value })} placeholder="Poster URL *" className="rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary" required />
            <input value={payload.banner || ""} onChange={(e) => setPayload({ ...payload, banner: e.target.value })} placeholder="Banner URL" className="rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary" />
            <input type="number" value={payload.year || ""} onChange={(e) => setPayload({ ...payload, year: Number(e.target.value) })} placeholder="Year" className="rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary" />
            <input value={payload.category || ""} onChange={(e) => setPayload({ ...payload, category: e.target.value })} placeholder="Category" className="rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary" />
            <input value={payload.rating?.toString() || "0"} onChange={(e) => setPayload({ ...payload, rating: Number(e.target.value) })} placeholder="Rating (0-10)" className="rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary" />
            <input value={payload.quality || ""} onChange={(e) => setPayload({ ...payload, quality: e.target.value })} placeholder="Quality (HD/4K)" className="rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary" />
          </div>

          {mode === "movie" ? (
            <div className="space-y-4">
              <input value={payload.hlsLink || ""} onChange={(e) => setPayload({ ...payload, hlsLink: e.target.value })} placeholder="HLS Link" className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary" />
              <input value={payload.embedIframeLink || ""} onChange={(e) => setPayload({ ...payload, embedIframeLink: e.target.value })} placeholder="Embed Iframe Link" className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary" />
              <textarea value={movieSubtitlesInput} onChange={(e) => setMovieSubtitlesInput(e.target.value)} placeholder="Subtitles: lang|label|url|default (one per line)" className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary min-h-[80px]" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">Seasons & Episodes</p>
                <button type="button" onClick={addSeason} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-black">+ Add Season</button>
              </div>
              {seasonsDraft.map((season, seasonIndex) => (
                <div key={`season-${seasonIndex}`} className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <input type="number" min={1} value={season.seasonNumber} onChange={(e) => updateSeasonField(seasonIndex, Number(e.target.value) || season.seasonNumber)} className="w-20 rounded border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white" />
                    <span className="text-sm text-gray-400">Season {seasonIndex + 1}</span>
                    <button type="button" onClick={() => addEpisode(seasonIndex)} className="ml-auto rounded bg-white/10 px-2 py-1 text-xs text-white">+ Episode</button>
                    {seasonsDraft.length > 1 && <button type="button" onClick={() => removeSeason(seasonIndex)} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400">Remove</button>}
                  </div>
                  {season.episodes.map((episode, episodeIndex) => (
                    <div key={`episode-${seasonIndex}-${episodeIndex}`} className="mb-2 grid gap-2 rounded bg-black/30 p-3 md:grid-cols-2">
                      <input type="number" min={1} value={episode.episodeNumber} onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "episodeNumber", e.target.value)} placeholder="Ep #" className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                      <input value={episode.episodeTitle} onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "episodeTitle", e.target.value)} placeholder="Episode title" className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                      <input value={episode.hlsLink || ""} onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "hlsLink", e.target.value)} placeholder="HLS Link" className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                      <input value={episode.embedIframeLink || ""} onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "embedIframeLink", e.target.value)} placeholder="Iframe Link" className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                      {episodeIndex > 0 && <button type="button" onClick={() => removeEpisode(seasonIndex, episodeIndex)} className="col-span-2 rounded bg-red-500/20 py-1.5 text-xs text-red-400">Remove Episode</button>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <textarea value={payload.description || ""} onChange={(e) => setPayload({ ...payload, description: e.target.value })} placeholder="Description" className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary min-h-[100px]" />

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-black transition hover:bg-primary/90">
              {editingId ? "Update Content" : "Save Content"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { resetForm(); setStatus(""); }} className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-white">
                Cancel
              </button>
            )}
            <span className="text-sm text-gray-400">Slug: {slugPreview || "—"}</span>
          </div>
          {status && <p className="text-sm text-primary">{status}</p>}
        </form>
      )}

      {activeTab === "import" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-lg font-medium text-white">TMDB Auto Import</h2>
          <div className="flex gap-2">
            <input value={tmdbQuery} onChange={(e) => setTmdbQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchTMDB()} placeholder={mode === "movie" ? "Search movie..." : "Search series..."} className="flex-1 rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary" />
            <button onClick={searchTMDB} disabled={loading} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-black disabled:opacity-50">
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((item) => (
              <button key={`${item.mediaType}-${item.id}`} onClick={() => importTMDB(item.id, item.mediaType)} className="flex gap-3 rounded-lg border border-white/10 bg-black/30 p-3 text-left transition hover:border-primary">
                {item.poster ? <Image src={item.poster} alt={item.title} width={60} height={80} className="h-20 w-14 rounded object-cover" /> : <div className="h-20 w-14 rounded bg-black/50" />}
                <div>
                  <p className="line-clamp-2 font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-400">{item.mediaType.toUpperCase()} | {item.year || "—"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
