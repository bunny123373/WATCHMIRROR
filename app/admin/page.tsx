"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2, X, Film, Tv, BarChart3, Clock, Star, Globe, Tag, Lock, ChevronRight, LayoutGrid, List, Grid3X3, Calendar, Sparkles, Database, AlertCircle } from "lucide-react";
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

const ADMIN_STORAGE_KEY = "watchmirror_admin_key";
const ADMIN_SESSION_DURATION = 60 * 60 * 1000; // 1 hour

export default function AdminPage() {
  const [mode, setMode] = useState<ContentType>("movie");
  const [adminKey, setAdminKey] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
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

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
      try {
        const { key, expiry } = JSON.parse(stored);
        if (expiry && Date.now() < expiry) {
          setAdminKey(key);
          setAuthorized(true);
          loadContent(key);
        } else {
          localStorage.removeItem(ADMIN_STORAGE_KEY);
          setLoading(false);
        }
      } catch {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadContent = async (key?: string) => {
    setLoading(true);
    const res = await fetch("/api/admin/content", {
      method: "GET",
      headers: { "x-admin-key": key || adminKey }
    });
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setItems(Array.isArray(data.items) ? data.items : []);
    setLoading(false);
  };

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

    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify({
      key: adminKey,
      expiry: Date.now() + ADMIN_SESSION_DURATION
    }));
    setAuthorized(true);
    setStatus("");
    await loadContent();
  };

  if (!authorized) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-800 shadow-2xl shadow-red-900/50">
              <Lock className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-[var(--font-heading)] text-4xl font-bold text-white">Admin Portal</h1>
            <p className="mt-3 text-gray-400">Enter your credentials to access the dashboard</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/80 p-8 shadow-2xl backdrop-blur-xl">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-400 uppercase tracking-wider">Admin Key</label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && unlockAdmin()}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-base text-white placeholder:text-gray-600 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                placeholder="Enter your admin key"
                autoFocus
              />
              </div>
            <button
              onClick={unlockAdmin}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 text-base font-bold text-white transition-all hover:from-red-500 hover:to-red-600 hover:shadow-lg hover:shadow-red-600/25"
            >
              Access Dashboard
            </button>
            </div>
            {status && (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[var(--font-heading)] text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your content library</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white/5 p-1">
          {(["browse", "add", "import"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab 
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "browse" && <LayoutGrid className="h-4 w-4" />}
              {tab === "add" && <Plus className="h-4 w-4" />}
              {tab === "import" && <Sparkles className="h-4 w-4" />}
              {tab === "browse" && "Browse"}
              {tab === "add" && (editingId ? "Edit" : "Add New")}
              {tab === "import" && "Import"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-5 transition-all hover:border-white/20 hover:shadow-xl hover:shadow-black/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-600/20 blur-2xl transition-all group-hover:bg-red-600/30" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-600/30">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Content</p>
              <p className="text-3xl font-bold text-white">{analytics.total}</p>
            </div>
          </div>
        </div>
        <Link href="/admin/movies" className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-5 transition-all hover:border-white/20 hover:shadow-xl hover:shadow-black/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl transition-all group-hover:bg-blue-500/30" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-600/30">
              <Film className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Movies</p>
              <p className="text-3xl font-bold text-white">{analytics.movies}</p>
            </div>
          </div>
        </Link>
        <Link href="/admin/series" className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-5 transition-all hover:border-white/20 hover:shadow-xl hover:shadow-black/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-purple-500/20 blur-2xl transition-all group-hover:bg-purple-500/30" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-600/30">
              <Tv className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Series</p>
              <p className="text-3xl font-bold text-white">{analytics.series}</p>
            </div>
          </div>
        </Link>
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-5 transition-all hover:border-white/20 hover:shadow-xl hover:shadow-black/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-yellow-500/20 blur-2xl transition-all group-hover:bg-yellow-500/30" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-600/30">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Rating</p>
              <p className="text-3xl font-bold text-white">{analytics.avgRating}</p>
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-5 transition-all hover:border-white/20 hover:shadow-xl hover:shadow-black/50">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-green-500/20 blur-2xl transition-all group-hover:bg-green-500/30" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-600/30">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</p>
              <p className="text-3xl font-bold text-white">{analytics.scheduled}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/50 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20">
              <Globe className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Top Languages</h3>
          </div>
          <div className="space-y-2">
            {analytics.topLanguages.length > 0 ? analytics.topLanguages.map(([name, count], idx) => (
              <div key={name} className="group flex items-center justify-between rounded-xl bg-black/30 px-4 py-3 transition-colors hover:bg-black/50">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-xs font-medium text-gray-400">{idx + 1}</span>
                  <span className="text-sm font-medium text-gray-200">{name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(count / analytics.total) * 100}%` }} />
                  </div>
                  <span className="min-w-[2rem] text-right text-sm font-semibold text-gray-400">{count}</span>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">No data available</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/50 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20">
              <Tag className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Top Categories</h3>
          </div>
          <div className="space-y-2">
            {analytics.topCategories.length > 0 ? analytics.topCategories.map(([name, count], idx) => (
              <div key={name} className="group flex items-center justify-between rounded-xl bg-black/30 px-4 py-3 transition-colors hover:bg-black/50">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-xs font-medium text-gray-400">{idx + 1}</span>
                  <span className="text-sm font-medium text-gray-200">{name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${(count / analytics.total) * 100}%` }} />
                  </div>
                  <span className="min-w-[2rem] text-right text-sm font-semibold text-gray-400">{count}</span>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">No data available</p>}
          </div>
        </div>
      </div>

      {activeTab === "browse" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#1a1a1a]/50 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => applyMode("movie")}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                  mode === "movie" 
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30" 
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Film className="h-4 w-4" />
                Movies ({analytics.movies})
              </button>
              <button
                onClick={() => applyMode("series")}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                  mode === "series" 
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30" 
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Tv className="h-4 w-4" />
                Series ({analytics.series})
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={contentSearch}
                onChange={(e) => {
                  setContentSearch(e.target.value);
                  setContentPage(1);
                }}
                placeholder="Search content..."
                className="w-full rounded-xl border border-white/10 bg-black/40 pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 sm:w-72"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedItems.map((item) => (
              <div key={item._id || item.slug} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a]/50 transition-all hover:border-white/30 hover:shadow-2xl hover:shadow-black/50">
                <div className="flex gap-4 p-4">
                  {item.poster ? (
                    <Image src={item.poster} alt={item.title} width={80} height={120} className="h-[120px] w-[80px] rounded-xl object-cover shadow-lg" />
                  ) : (
                    <div className="flex h-[120px] w-[80px] items-center justify-center rounded-xl bg-black/40">
                      <Film className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col">
                    <p className="truncate font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.year} · {item.language} · {item.rating?.toFixed(1)} ★</p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-3">
                      <button
                        onClick={() => startEdit(item)}
                        className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => duplicateContent(item)}
                        className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
                      >
                        <Plus className="h-3 w-3" />
                        Copy
                      </button>
                      <button
                        onClick={() => deleteContent(item._id)}
                        className="flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
                {item.publishAt && new Date(item.publishAt).getTime() > Date.now() && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-yellow-500/20 px-2.5 py-1 text-xs font-medium text-yellow-400">
                    <Clock className="h-3 w-3" />
                    Scheduled
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setContentPage((p) => Math.max(1, p - 1))}
                disabled={contentPage === 1}
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Previous
              </button>
              <div className="flex items-center gap-1 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-gray-300">
                <span className="text-white">{contentPage}</span>
                <span className="text-gray-500">/</span>
                <span>{totalPages}</span>
              </div>
              <button
                onClick={() => setContentPage((p) => Math.min(totalPages, p + 1))}
                disabled={contentPage === totalPages}
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "add" && (
        <form onSubmit={submitContent} className="space-y-6 rounded-2xl border border-white/10 bg-[#1a1a1a]/50 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-700">
              {editingId ? <Pencil className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{editingId ? "Edit Content" : "Add New Content"}</h2>
              <p className="text-sm text-gray-500">{editingId ? "Update the content details below" : "Fill in the details to add new content"}</p>
            </div>
          </div>
          
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Title *</label>
              <input value={payload.title || ""} onChange={(e) => setPayload({ ...payload, title: e.target.value })} placeholder="Enter title" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Type</label>
                <select value={mode} onChange={(e) => applyMode(e.target.value as "movie" | "series")} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition-all focus:border-red-500">
                  <option value="movie">Movie</option>
                  <option value="series">Series</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Language</label>
                <select value={payload.language || ""} onChange={(e) => setPayload({ ...payload, language: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition-all focus:border-red-500">
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
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Poster URL *</label>
              <input value={payload.poster || ""} onChange={(e) => setPayload({ ...payload, poster: e.target.value })} placeholder="https://..." className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Banner URL</label>
              <input value={payload.banner || ""} onChange={(e) => setPayload({ ...payload, banner: e.target.value })} placeholder="https://..." className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Year</label>
                <input type="number" value={payload.year || ""} onChange={(e) => setPayload({ ...payload, year: Number(e.target.value) })} placeholder="2024" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Category</label>
                <input value={payload.category || ""} onChange={(e) => setPayload({ ...payload, category: e.target.value })} placeholder="Latest" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Rating</label>
                <input value={payload.rating?.toString() || "0"} onChange={(e) => setPayload({ ...payload, rating: Number(e.target.value) })} placeholder="0-10" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Quality</label>
                <input value={payload.quality || ""} onChange={(e) => setPayload({ ...payload, quality: e.target.value })} placeholder="HD / 4K" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
              </div>
            </div>
          </div>

          {mode === "movie" ? (
            <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Film className="h-4 w-4 text-red-500" />
                Movie Sources
              </h3>
              <div className="grid gap-4">
                <input value={payload.hlsLink || ""} onChange={(e) => setPayload({ ...payload, hlsLink: e.target.value })} placeholder="HLS Link (.m3u8)" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
                <input value={payload.embedIframeLink || ""} onChange={(e) => setPayload({ ...payload, embedIframeLink: e.target.value })} placeholder="Embed Iframe Link" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Subtitles</label>
                  <textarea value={movieSubtitlesInput} onChange={(e) => setMovieSubtitlesInput(e.target.value)} placeholder="lang|label|url|default (one per line)&#10;en|English|https://...|default&#10;te|Telugu|https://..." className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 min-h-[100px]" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Tv className="h-4 w-4 text-red-500" />
                  Seasons & Episodes
                </h3>
                <button type="button" onClick={addSeason} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-xs font-bold text-white transition-all hover:from-red-500 hover:to-red-600">
                  <Plus className="h-3 w-3" />
                  Add Season
                </button>
              </div>
              {seasonsDraft.map((season, seasonIndex) => (
                <div key={`season-${seasonIndex}`} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <div className="flex items-center gap-3 bg-white/5 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-400">Season</span>
                      <input type="number" min={1} value={season.seasonNumber} onChange={(e) => updateSeasonField(seasonIndex, Number(e.target.value) || season.seasonNumber)} className="w-16 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-center text-sm text-white" />
                    </div>
                    <span className="text-sm text-gray-500">{season.episodes.length} episode{season.episodes.length !== 1 ? 's' : ''}</span>
                    <div className="ml-auto flex gap-2">
                      <button type="button" onClick={() => addEpisode(seasonIndex)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20">+ Episode</button>
                      {seasonsDraft.length > 1 && <button type="button" onClick={() => removeSeason(seasonIndex)} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/30">Remove</button>}
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-3 space-y-2">
                    {season.episodes.map((episode, episodeIndex) => (
                      <div key={`episode-${seasonIndex}-${episodeIndex}`} className="grid gap-2 rounded-lg bg-black/40 p-3 md:grid-cols-2">
                        <input type="number" min={1} value={episode.episodeNumber} onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "episodeNumber", e.target.value)} placeholder="Ep #" className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                        <input value={episode.episodeTitle} onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "episodeTitle", e.target.value)} placeholder="Episode title" className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                        <input value={episode.hlsLink || ""} onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "hlsLink", e.target.value)} placeholder="HLS Link" className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                        <input value={episode.embedIframeLink || ""} onChange={(e) => updateEpisodeField(seasonIndex, episodeIndex, "embedIframeLink", e.target.value)} placeholder="Iframe Link" className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                        {episodeIndex > 0 && <button type="button" onClick={() => removeEpisode(seasonIndex, episodeIndex)} className="col-span-2 rounded-lg bg-red-500/20 py-2 text-xs text-red-400 hover:bg-red-500/30">Remove Episode</button>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Description</label>
            <textarea value={payload.description || ""} onChange={(e) => setPayload({ ...payload, description: e.target.value })} placeholder="Enter content description..." className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 min-h-[120px]" />
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10">
            <button type="submit" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-8 py-3 text-sm font-bold text-white transition-all hover:from-red-500 hover:to-red-600 hover:shadow-lg hover:shadow-red-600/25">
              {editingId ? "Update Content" : "Save Content"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { resetForm(); setStatus(""); }} className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-gray-300 transition-all hover:border-white/20 hover:text-white">
                Cancel
              </button>
            )}
            <span className="ml-auto text-sm text-gray-500">Slug: <span className="font-mono text-gray-400">{slugPreview || "—"}</span></span>
          </div>
          {status && (
            <div className={`flex items-center gap-2 rounded-xl p-3 text-sm ${status.includes('success') || status.includes('updated') || status.includes('saved') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {status.includes('success') || status.includes('updated') || status.includes('saved') ? <Star className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {status}
            </div>
          )}
        </form>
      )}

      {activeTab === "import" && (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-[#1a1a1a]/50 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-purple-700">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">TMDB Auto Import</h2>
              <p className="text-sm text-gray-500">Search and import content from The Movie Database</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input value={tmdbQuery} onChange={(e) => setTmdbQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchTMDB()} placeholder={mode === "movie" ? "Search for movies..." : "Search for series..."} className="w-full rounded-xl border border-white/10 bg-black/40 pl-12 pr-4 py-3.5 text-base text-white placeholder:text-gray-500 outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
            </div>
            <button onClick={searchTMDB} disabled={loading} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-3.5 text-base font-bold text-white transition-all hover:from-purple-500 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-600/25 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search
                </>
              )}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {searchResults.map((item) => (
                <button key={`${item.mediaType}-${item.id}`} onClick={() => importTMDB(item.id, item.mediaType)} className="group flex gap-4 rounded-xl border border-white/10 bg-black/30 p-3 text-left transition-all hover:border-purple-500 hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/20">
                  {item.poster ? (
                    <Image src={item.poster} alt={item.title} width={70} height={100} className="h-[100px] w-[70px] rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-[100px] w-[70px] items-center justify-center rounded-lg bg-black/50">
                      <Film className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="line-clamp-2 font-semibold text-white transition-colors group-hover:text-purple-400">{item.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-gray-300">{item.mediaType.toUpperCase()}</span>
                      {item.year || "—"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {!loading && tmdbQuery && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Film className="h-16 w-16 text-gray-700" />
              <p className="mt-4 text-lg font-medium text-gray-400">No results found</p>
              <p className="text-sm text-gray-600">Try searching with different keywords</p>
            </div>
          )}
          
          {!tmdbQuery && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-500/20">
                <Sparkles className="h-10 w-10 text-purple-400" />
              </div>
              <p className="text-lg font-medium text-gray-400">Search TMDB Database</p>
              <p className="mt-1 text-sm text-gray-600">Enter a movie or series name to import details automatically</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
