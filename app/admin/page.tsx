"use client";

import { FormEvent, useEffect, useMemo, useState, useCallback, DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Pencil, Plus, Search, Trash2, X, Film, Tv, BarChart3, Clock, Star, Globe, Tag, Lock, ChevronRight, LayoutGrid, List, Grid3X3, Calendar, Sparkles, Database, AlertCircle, Upload, FileVideo, CheckCircle2, File, FolderOpen, Languages, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { Content, ContentType, Season, SubtitleTrack, VideoSource } from "@/types/content";

const emptyPayload: Partial<Content> = {
  type: "movie",
  title: "",
  poster: "",
  banner: "",
  description: "",
  year: new Date().getFullYear(),
  language: "EN",
  audioLanguages: [],
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
  downloadLink: "",
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
  const searchParams = useSearchParams();
  const urlMode = searchParams.get("mode");
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
  const [activeTab, setActiveTab] = useState<"browse" | "add" | "import" | "upload">("browse");
  const itemsPerPage = 20;
  
  const [uploadLanguage, setUploadLanguage] = useState<string>("EN");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadQueue, setUploadQueue] = useState<{ file: File; status: 'pending' | 'uploading' | 'done' | 'error'; progress: number; metadata: Partial<Content> }[]>([]);
  const [dragOverLanguage, setDragOverLanguage] = useState<string | null>(null);
  const [expandedLanguages, setExpandedLanguages] = useState<Record<string, boolean>>({});
  
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);

  useEffect(() => {
    if (urlMode === "series") {
      setMode("series");
      setActiveTab("add");
    } else if (urlMode === "movie") {
      setMode("movie");
      setActiveTab("add");
    }
  }, [urlMode]);

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
    setVideoSources(item.videoSources || []);
    setStatus(`Editing: ${item.title}`);
    setActiveTab("add");
  };

  const resetForm = () => {
    setEditingId(null);
    setPayload({ ...emptyPayload, type: mode });
    setSeasonsDraft([createSeason(1)]);
    setMovieSubtitlesInput("");
    setVideoSources([]);
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

  const addVideoSource = (langCode: string) => {
    const lang = LANGUAGES.find(l => l.code === langCode);
    if (!lang) return;
    if (videoSources.some(v => v.language === langCode)) return;
    setVideoSources(prev => [...prev, {
      language: langCode,
      languageLabel: lang.name,
      hlsLink: "",
      mp4Link: "",
      quality: "HD",
      isPrimary: prev.length === 0
    }]);
  };

  const removeVideoSource = (langCode: string) => {
    setVideoSources(prev => {
      const filtered = prev.filter(v => v.language !== langCode);
      if (filtered.length > 0 && !filtered.some(v => v.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const updateVideoSource = (langCode: string, updates: Partial<VideoSource>) => {
    setVideoSources(prev => prev.map(v => 
      v.language === langCode ? { ...v, ...updates } : v
    ));
  };

  const setPrimaryVideoSource = (langCode: string) => {
    setVideoSources(prev => prev.map(v => ({
      ...v,
      isPrimary: v.language === langCode
    })));
  };

  const LANGUAGES = [
    { code: "EN", name: "English", flag: "🇺🇸" },
    { code: "TE", name: "Telugu", flag: "🇮🇳" },
    { code: "HI", name: "Hindi", flag: "🇮🇳" },
    { code: "TA", name: "Tamil", flag: "🇮🇳" },
    { code: "ML", name: "Malayalam", flag: "🇮🇳" },
    { code: "KN", name: "Kannada", flag: "🇮🇳" },
    { code: "KO", name: "Korean", flag: "🇰🇷" },
    { code: "JA", name: "Japanese", flag: "🇯🇵" },
    { code: "ES", name: "Spanish", flag: "🇪🇸" },
    { code: "TH", name: "Thai", flag: "🇹🇭" },
    { code: "ZH", name: "Chinese", flag: "🇨🇳" }
  ];

  const extractMetadataFromFilename = (filename: string): Partial<Content> => {
    const name = filename.replace(/\.[^/.]+$/, "");
    const parts = name.split(/[-_]/).map(p => p.trim());
    
    let title = name;
    let year: number | undefined;
    let quality = "HD";
    
    const yearMatch = name.match(/(19|20)\d{2}/);
    if (yearMatch) {
      year = parseInt(yearMatch[0]);
    }
    
    if (name.toLowerCase().includes("4k") || name.toLowerCase().includes("2160p")) {
      quality = "4K";
    } else if (name.toLowerCase().includes("1080p")) {
      quality = "FHD";
    } else if (name.toLowerCase().includes("720p")) {
      quality = "HD";
    }
    
    if (parts.length > 1) {
      const potentialTitle = parts.slice(0, -1).join(" ");
      if (potentialTitle.length > 2) {
        title = potentialTitle;
      }
    }
    
    return { title, year, quality };
  };

  const handleFileSelect = useCallback((files: FileList | null, language: string) => {
    if (!files) return;
    
    const videoFiles = Array.from(files).filter(file => 
      file.type.startsWith("video/") || 
      [".mp4", ".mkv", ".avi", ".mov", ".webm", ".m3u8", ".ts"].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );
    
    if (videoFiles.length === 0) return;
    
    const newQueueItems = videoFiles.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0,
      metadata: {
        ...extractMetadataFromFilename(file.name),
        language,
        type: "movie" as const,
        category: "Latest"
      }
    }));
    
    setUploadQueue(prev => [...prev, ...newQueueItems]);
    
    setExpandedLanguages(prev => ({ ...prev, [language]: true }));
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, language: string) => {
    e.preventDefault();
    setDragOverLanguage(null);
    handleFileSelect(e.dataTransfer.files, language);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, language: string) => {
    e.preventDefault();
    setDragOverLanguage(language);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverLanguage(null);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQueueMetadata = useCallback((index: number, updates: Partial<Content>) => {
    setUploadQueue(prev => prev.map((item, i) => 
      i === index ? { ...item, metadata: { ...item.metadata, ...updates } } : item
    ));
  }, []);

  const toggleLanguageExpanded = useCallback((language: string) => {
    setExpandedLanguages(prev => ({ ...prev, [language]: !prev[language] }));
  }, []);

  const uploadAllForLanguage = useCallback(async (language: string) => {
    const itemsToUpload = uploadQueue.filter(item => 
      item.metadata.language === language && item.status === 'pending'
    );
    
    for (const item of itemsToUpload) {
      const index = uploadQueue.findIndex(q => q.file === item.file);
      if (index === -1) continue;
      
      setUploadQueue(prev => prev.map((q, i) => 
        i === index ? { ...q, status: 'uploading' } : q
      ));
      
      try {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("metadata", JSON.stringify({
          ...item.metadata,
          type: item.metadata.type || "movie"
        }));
        
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "x-admin-key": adminKey },
          body: formData
        });
        
        if (res.ok) {
          setUploadQueue(prev => prev.map((q, i) => 
            i === index ? { ...q, status: 'done', progress: 100 } : q
          ));
        } else {
          setUploadQueue(prev => prev.map((q, i) => 
            i === index ? { ...q, status: 'error' } : q
          ));
        }
      } catch {
        setUploadQueue(prev => prev.map((q, i) => 
          i === index ? { ...q, status: 'error' } : q
        ));
      }
    }
    
    await loadContent();
  }, [uploadQueue, adminKey, loadContent]);

  const uploadAll = useCallback(async () => {
    const pendingItems = uploadQueue.filter(item => item.status === 'pending');
    
    for (const item of pendingItems) {
      const index = uploadQueue.findIndex(q => q.file === item.file);
      if (index === -1) continue;
      
      setUploadQueue(prev => prev.map((q, i) => 
        i === index ? { ...q, status: 'uploading' } : q
      ));
      
      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "x-admin-key": adminKey },
          body: JSON.stringify({
            ...item.metadata,
            filename: item.file.name,
            type: item.metadata.type || "movie"
          })
        });
        
        if (res.ok) {
          setUploadQueue(prev => prev.map((q, i) => 
            i === index ? { ...q, status: 'done', progress: 100 } : q
          ));
        } else {
          setUploadQueue(prev => prev.map((q, i) => 
            i === index ? { ...q, status: 'error' } : q
          ));
        }
      } catch {
        setUploadQueue(prev => prev.map((q, i) => 
          i === index ? { ...q, status: 'error' } : q
        ));
      }
    }
    
    await loadContent();
  }, [uploadQueue, adminKey, loadContent]);

  const clearCompleted = useCallback(() => {
    setUploadQueue(prev => prev.filter(item => item.status !== 'done'));
  }, []);

  const getQueueForLanguage = useCallback((language: string) => {
    return uploadQueue.filter(item => item.metadata.language === language);
  }, [uploadQueue]);

  const getLanguageStats = useMemo(() => {
    return LANGUAGES.map(lang => {
      const items = getQueueForLanguage(lang.code);
      return {
        ...lang,
        total: items.length,
        pending: items.filter(i => i.status === 'pending').length,
        done: items.filter(i => i.status === 'done').length,
        error: items.filter(i => i.status === 'error').length
      };
    });
  }, [getQueueForLanguage]);

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
        videoSources: mode === "movie" ? videoSources : [],
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
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-white/5 p-1">
          {(["browse", "add", "upload", "import"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab 
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "browse" && <LayoutGrid className="h-4 w-4" />}
              {tab === "add" && <Plus className="h-4 w-4" />}
              {tab === "upload" && <Upload className="h-4 w-4" />}
              {tab === "import" && <Sparkles className="h-4 w-4" />}
              {tab === "browse" && "Browse"}
              {tab === "add" && (editingId ? "Edit" : "Add New")}
              {tab === "upload" && "Upload"}
              {tab === "import" && "Import"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-4 lg:p-5 transition-all hover:border-white/20 hover:shadow-xl hover:shadow-black/50">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-red-600/20 blur-xl transition-all group-hover:bg-red-600/30 lg:-right-8 lg:-top-8 lg:h-24 lg:w-24" />
          <div className="relative flex items-center gap-3 lg:gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-600/30 lg:h-12 lg:w-12">
              <Database className="h-5 w-5 text-white lg:h-6 lg:w-6" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider lg:text-xs">Total</p>
              <p className="text-2xl font-bold text-white lg:text-3xl">{analytics.total}</p>
            </div>
          </div>
        </div>
        <Link href="/admin/movies" className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-4 lg:p-5 transition-all hover:border-white/20 hover:shadow-xl hover:shadow-black/50">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-500/20 blur-xl transition-all group-hover:bg-blue-500/30 lg:-right-8 lg:-top-8 lg:h-24 lg:w-24" />
          <div className="relative flex items-center gap-3 lg:gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-600/30 lg:h-12 lg:w-12">
              <Film className="h-5 w-5 text-white lg:h-6 lg:w-6" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider lg:text-xs">Movies</p>
              <p className="text-2xl font-bold text-white lg:text-3xl">{analytics.movies}</p>
            </div>
          </div>
        </Link>
        <Link href="/admin/series" className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-4 lg:p-5 transition-all hover:border-white/20 hover:shadow-xl hover:shadow-black/50">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-purple-500/20 blur-xl transition-all group-hover:bg-purple-500/30 lg:-right-8 lg:-top-8 lg:h-24 lg:w-24" />
          <div className="relative flex items-center gap-3 lg:gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-600/30 lg:h-12 lg:w-12">
              <Tv className="h-5 w-5 text-white lg:h-6 lg:w-6" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider lg:text-xs">Series</p>
              <p className="text-2xl font-bold text-white lg:text-3xl">{analytics.series}</p>
            </div>
          </div>
        </Link>
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-4 lg:p-5 transition-all hover:border-white/20 hover:shadow-xl hover:shadow-black/50">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-yellow-500/20 blur-xl transition-all group-hover:bg-yellow-500/30 lg:-right-8 lg:-top-8 lg:h-24 lg:w-24" />
          <div className="relative flex items-center gap-3 lg:gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-600/30 lg:h-12 lg:w-12">
              <Star className="h-5 w-5 text-white lg:h-6 lg:w-6" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider lg:text-xs">Rating</p>
              <p className="text-2xl font-bold text-white lg:text-3xl">{analytics.avgRating}</p>
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-4 lg:p-5 transition-all hover:border-white/20 hover:shadow-xl hover:shadow-black/50">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-green-500/20 blur-xl transition-all group-hover:bg-green-500/30 lg:-right-8 lg:-top-8 lg:h-24 lg:w-24" />
          <div className="relative flex items-center gap-3 lg:gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-600/30 lg:h-12 lg:w-12">
              <Clock className="h-5 w-5 text-white lg:h-6 lg:w-6" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider lg:text-xs">Scheduled</p>
              <p className="text-2xl font-bold text-white lg:text-3xl">{analytics.scheduled}</p>
            </div>
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
                  <option value="TH">Thai</option>
                  <option value="ZH">Chinese</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Audio Languages</label>
              <div className="flex flex-wrap gap-2">
                {["EN", "TE", "HI", "TA", "ML", "KN", "KO", "JA", "ES", "TH", "ZH"].map((lang) => {
                  const langNames: Record<string, string> = {
                    EN: "English", TE: "Telugu", HI: "Hindi", TA: "Tamil", ML: "Malayalam",
                    KN: "Kannada", KO: "Korean", JA: "Japanese", ES: "Spanish", TH: "Thai", ZH: "Chinese"
                  };
                  const isSelected = (payload.audioLanguages || []).includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        const current = payload.audioLanguages || [];
                        const updated = isSelected
                          ? current.filter((l) => l !== lang)
                          : [...current, lang];
                        setPayload({ ...payload, audioLanguages: updated });
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-red-600 text-white"
                          : "bg-white/10 text-gray-400 hover:bg-white/20"
                      }`}
                    >
                      {langNames[lang]}
                    </button>
                  );
                })}
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
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Languages className="h-4 w-4 text-red-500" />
                  Language-wise Video Sources
                </h3>
              </div>
              
              <div className="grid gap-3">
                {LANGUAGES.filter(l => !videoSources.some(v => v.language === l.code)).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.filter(l => !videoSources.some(v => v.language === l.code)).map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => addVideoSource(lang.code)}
                        className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition-all hover:border-red-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Plus className="h-3 w-3" />
                        {lang.flag} {lang.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {videoSources.length > 0 && (
                <div className="space-y-3">
                  {videoSources.map((source) => (
                    <div key={source.language} className={`rounded-xl border ${source.isPrimary ? 'border-red-500 bg-red-500/5' : 'border-white/10 bg-black/40'} p-4`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{LANGUAGES.find(l => l.code === source.language)?.flag}</span>
                          <span className="font-medium text-white">{source.languageLabel}</span>
                          {source.isPrimary && (
                            <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Primary</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!source.isPrimary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryVideoSource(source.language)}
                              className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white"
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeVideoSource(source.language)}
                            className="rounded p-1 text-gray-500 hover:bg-red-500/20 hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={source.hlsLink || ""}
                          onChange={(e) => updateVideoSource(source.language, { hlsLink: e.target.value })}
                          placeholder="HLS Link (.m3u8)"
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-red-500"
                        />
                        <input
                          value={source.mp4Link || ""}
                          onChange={(e) => updateVideoSource(source.language, { mp4Link: e.target.value })}
                          placeholder="MP4 Link (Direct)"
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-red-500"
                        />
                        <select
                          value={source.quality || "HD"}
                          onChange={(e) => updateVideoSource(source.language, { quality: e.target.value })}
                          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                        >
                          <option value="SD">SD</option>
                          <option value="HD">HD</option>
                          <option value="FHD">FHD (1080p)</option>
                          <option value="4K">4K</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 pt-4 border-t border-white/10">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Subtitles (Global)</label>
                <textarea value={movieSubtitlesInput} onChange={(e) => setMovieSubtitlesInput(e.target.value)} placeholder="lang|label|url|default (one per line)&#10;en|English|https://...|default&#10;te|Telugu|https://..." className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 min-h-[80px]" />
              </div>
              
              <input value={payload.downloadLink || ""} onChange={(e) => setPayload({ ...payload, downloadLink: e.target.value })} placeholder="Download Link (Google Drive, OneDrive, etc.)" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
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

          {tmdbResults.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tmdbResults.map((item) => (
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
                      <span className="rounded bg-white/10 px-2 py-0.5 text-gray-300">{item.mediaType?.toUpperCase()}</span>
                      {item.year || "—"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {!loading && tmdbQuery && tmdbResults.length === 0 && (
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

      {activeTab === "upload" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Upload Videos by Language</h2>
              <p className="text-sm text-gray-500">Drag and drop video files or click to browse</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <FolderOpen className="h-4 w-4 text-blue-500" />
                    Global Upload
                  </h3>
                  <select 
                    value={uploadLanguage} 
                    onChange={(e) => setUploadLanguage(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white outline-none"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                    ))}
                  </select>
                </div>
                <div
                  onDrop={(e) => handleDrop(e, uploadLanguage)}
                  onDragOver={(e) => handleDragOver(e, uploadLanguage)}
                  onDragLeave={handleDragLeave}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
                    dragOverLanguage === uploadLanguage
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/20 hover:border-white/30"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="video/*,.m3u8,.ts"
                    onChange={(e) => handleFileSelect(e.target.files, uploadLanguage)}
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  />
                  <FileVideo className={`h-12 w-12 mb-3 ${dragOverLanguage === uploadLanguage ? "text-blue-400" : "text-gray-500"}`} />
                  <p className="text-center text-sm text-gray-400">
                    <span className="font-medium text-blue-400">Click to browse</span> or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-gray-600">MP4, MKV, AVI, MOV, WebM, M3U8</p>
                </div>
                {uploadQueue.length > 0 && (
                  <button
                    onClick={uploadAll}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-bold text-white transition-all hover:from-blue-500 hover:to-blue-600"
                  >
                    Upload All ({uploadQueue.filter(i => i.status === 'pending').length} pending)
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/50 p-6 backdrop-blur-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Languages className="h-4 w-4 text-blue-500" />
                  Language Stats
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {getLanguageStats.filter(l => l.total > 0).map(lang => (
                    <div key={lang.code} className="rounded-lg bg-black/40 p-3 text-center">
                      <p className="text-lg font-bold text-white">{lang.total}</p>
                      <p className="text-xs text-gray-500">{lang.name}</p>
                      {lang.done > 0 && <p className="text-xs text-green-400">{lang.done} done</p>}
                      {lang.error > 0 && <p className="text-xs text-red-400">{lang.error} error</p>}
                    </div>
                  ))}
                </div>
                {uploadQueue.filter(i => i.status === 'done').length > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="mt-4 w-full rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 transition-all hover:border-white/20 hover:text-white"
                  >
                    Clear Completed
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <File className="h-4 w-4 text-blue-500" />
                Upload Queue ({uploadQueue.length})
              </h3>
              
              {uploadQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/20 py-16 text-center">
                  <FileVideo className="h-16 w-16 text-gray-700" />
                  <p className="mt-4 text-gray-500">No files in queue</p>
                  <p className="text-sm text-gray-600">Upload videos to see them here</p>
                </div>
              ) : (
                <div className="max-h-[600px] space-y-2 overflow-y-auto">
                  {uploadQueue.map((item, index) => (
                    <div key={`${item.file.name}-${index}`} className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                          item.status === 'done' ? 'bg-green-500/20 text-green-400' :
                          item.status === 'error' ? 'bg-red-500/20 text-red-400' :
                          item.status === 'uploading' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-white/10 text-gray-400'
                        }`}>
                          {item.status === 'done' ? <CheckCircle2 className="h-4 w-4" /> :
                           item.status === 'error' ? <XCircle className="h-4 w-4" /> :
                           item.status === 'uploading' ? <FileVideo className="h-4 w-4 animate-pulse" /> :
                           <FileVideo className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-white">{item.file.name}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {(item.file.size / (1024 * 1024)).toFixed(2)} MB · {item.metadata.language}
                          </p>
                          
                          <div className="mt-2 grid gap-2">
                            <input
                              type="text"
                              value={item.metadata.title || ""}
                              onChange={(e) => updateQueueMetadata(index, { title: e.target.value })}
                              placeholder="Title"
                              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-blue-500"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                value={item.metadata.year || ""}
                                onChange={(e) => updateQueueMetadata(index, { year: Number(e.target.value) })}
                                placeholder="Year"
                                className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-blue-500"
                              />
                              <select
                                value={item.metadata.quality || "HD"}
                                onChange={(e) => updateQueueMetadata(index, { quality: e.target.value })}
                                className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none"
                              >
                                <option value="SD">SD</option>
                                <option value="HD">HD</option>
                                <option value="FHD">FHD</option>
                                <option value="4K">4K</option>
                              </select>
                            </div>
                            <input
                              type="text"
                              value={item.metadata.category || ""}
                              onChange={(e) => updateQueueMetadata(index, { category: e.target.value })}
                              placeholder="Category (e.g., Latest, Trending)"
                              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromQueue(index)}
                          className="flex-shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-white/10 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/50 p-6 backdrop-blur-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Languages className="h-4 w-4 text-blue-500" />
              Language-wise Upload Sections
            </h3>
            <p className="mb-4 text-sm text-gray-500">Click on a language section to upload videos directly for that language</p>
            
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {LANGUAGES.map(lang => {
                const queueItems = getQueueForLanguage(lang.code);
                const isExpanded = expandedLanguages[lang.code];
                
                return (
                  <div key={lang.code} className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                    <div
                      onClick={() => toggleLanguageExpanded(lang.code)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <p className="font-medium text-white">{lang.name}</p>
                          <p className="text-xs text-gray-500">{queueItems.length} files in queue</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {queueItems.filter(i => i.status === 'pending').length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); uploadAllForLanguage(lang.code); }}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500"
                          >
                            Upload All
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    <div
                      onDrop={(e) => handleDrop(e, lang.code)}
                      onDragOver={(e) => handleDragOver(e, lang.code)}
                      onDragLeave={handleDragLeave}
                      className={`border-t border-white/10 transition-all ${
                        isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                      }`}
                    >
                      <div className={`p-3 ${dragOverLanguage === lang.code ? 'bg-blue-500/10' : ''}`}>
                        <input
                          type="file"
                          multiple
                          accept="video/*,.m3u8,.ts"
                          onChange={(e) => handleFileSelect(e.target.files, lang.code)}
                          className="hidden"
                          id={`upload-${lang.code}`}
                        />
                        <label
                          htmlFor={`upload-${lang.code}`}
                          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 cursor-pointer transition-all ${
                            dragOverLanguage === lang.code
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-white/20 hover:border-white/30"
                          }`}
                        >
                          <Upload className={`h-6 w-6 mb-2 ${dragOverLanguage === lang.code ? "text-blue-400" : "text-gray-500"}`} />
                          <p className="text-xs text-gray-400">Drop files or click</p>
                        </label>
                        
                        {queueItems.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {queueItems.map((item, idx) => {
                              const globalIndex = uploadQueue.findIndex(q => q.file === item.file);
                              return (
                                <div key={idx} className="flex items-center gap-2 rounded-lg bg-black/60 p-2">
                                  <div className={`flex h-6 w-6 items-center justify-center rounded ${
                                    item.status === 'done' ? 'bg-green-500/20 text-green-400' :
                                    item.status === 'error' ? 'bg-red-500/20 text-red-400' :
                                    item.status === 'uploading' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-white/10 text-gray-400'
                                  }`}>
                                    {item.status === 'done' ? <CheckCircle2 className="h-3 w-3" /> :
                                     item.status === 'error' ? <XCircle className="h-3 w-3" /> :
                                     item.status === 'uploading' ? <FileVideo className="h-3 w-3 animate-pulse" /> :
                                     <File className="h-3 w-3" />}
                                  </div>
                                  <span className="flex-1 truncate text-xs text-white">{item.file.name}</span>
                                  <button
                                    onClick={() => globalIndex >= 0 && removeFromQueue(globalIndex)}
                                    className="text-gray-500 hover:text-red-400"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
