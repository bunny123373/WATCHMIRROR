"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Trash2, Film, Tv, ChevronRight, LayoutGrid, Sparkles, AlertCircle, Calendar, Filter, ArrowUpDown, Star, Layers } from "lucide-react";
import { Content, Season, SubtitleTrack } from "@/types/content";

const emptyPayload: Partial<Content> = {
  type: "series",
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

const ADMIN_STORAGE_KEY = "watchmirror_admin_key";
const ADMIN_SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export default function AdminSeriesPage() {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [contentSearch, setContentSearch] = useState("");
  const [contentPage, setContentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"title" | "year" | "rating" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
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
        }
      } catch {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
      }
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

  const unlockAdmin = async () => {
    setStatus("Validating key...");
    const res = await fetch("/api/admin/content", {
      method: "GET",
      headers: { "x-admin-key": adminKey }
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

  const filteredItems = useMemo(() => {
    return items.filter((item) => item.type === "series");
  }, [items]);

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

  const sortedItems = useMemo(() => {
    return [...searchedItems].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "year":
          comparison = (a.year || 0) - (b.year || 0);
          break;
        case "rating":
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case "date":
        default:
          comparison = new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
          break;
      }
      return sortOrder === "desc" ? comparison : -comparison;
    });
  }, [searchedItems, sortBy, sortOrder]);

  const paginatedItems = useMemo(() => {
    const start = (contentPage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, contentPage]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const totalSeries = filteredItems.length;

  const getTotalEpisodes = (item: Content) => {
    return (item.seasons || []).reduce((acc, season) => acc + (season.episodes?.length || 0), 0);
  };

  const deleteContent = async (id?: string) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this series? This action cannot be undone.");
    if (!confirmed) return;
    setStatus("Deleting...");
    const res = await fetch(`/api/admin/content?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-admin-key": adminKey }
    });
    if (!res.ok) {
      const err = await res.json();
      setStatus(err.error || "Failed to delete");
      return;
    }
    await loadContent();
    setSelectedItems((prev) => { const next = new Set(prev); next.delete(id); return next; });
    setStatus("Series deleted successfully.");
  };

  const bulkDelete = async () => {
    if (selectedItems.size === 0) return;
    const confirmed = window.confirm(`Delete ${selectedItems.size} series? This action cannot be undone.`);
    if (!confirmed) return;
    setStatus("Deleting...");
    for (const id of selectedItems) {
      await fetch(`/api/admin/content?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey }
      });
    }
    setSelectedItems(new Set());
    await loadContent();
    setStatus("Series deleted successfully.");
  };

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === paginatedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedItems.map((item) => item._id || "").filter(Boolean)));
    }
  };

  if (!authorized) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 shadow-2xl shadow-purple-900/50">
              <Tv className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-[var(--font-heading)] text-4xl font-bold text-white">Series</h1>
            <p className="mt-3 text-gray-400">Enter your credentials to manage series</p>
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
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-base text-white placeholder:text-gray-600 outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  placeholder="Enter your admin key"
                  autoFocus
                />
              </div>
              <button
                onClick={unlockAdmin}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-base font-bold text-white transition-all hover:from-purple-500 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-600/25"
              >
                Access Series
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/admin" className="hover:text-white">Dashboard</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Series</span>
          </div>
          <h1 className="font-[var(--font-heading)] text-3xl font-bold text-white">Series</h1>
          <p className="mt-1 text-sm text-gray-500">{totalSeries} series in your library</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/add/series"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-2.5 text-sm font-bold text-white transition-all hover:from-purple-500 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-600/25"
          >
            <Plus className="h-4 w-4" />
            Add Series
          </Link>
          <Link
            href="/admin/import?type=series"
            className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/20"
          >
            <Sparkles className="h-4 w-4" />
            Import
          </Link>
        </div>
      </div>

      {selectedItems.size > 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
          <span className="text-sm font-medium text-purple-400">{selectedItems.size} selected</span>
          <button onClick={bulkDelete} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </button>
          <button onClick={() => setSelectedItems(new Set())} className="text-sm text-gray-400 hover:text-white">
            Clear
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#1a1a1a]/50 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={contentSearch}
            onChange={(e) => { setContentSearch(e.target.value); setContentPage(1); }}
            placeholder="Search series..."
            className="w-full rounded-xl border border-white/10 bg-black/40 pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="date">Date Added</option>
              <option value="title">Title</option>
              <option value="year">Year</option>
              <option value="rating">Rating</option>
            </select>
            <button
              onClick={() => setSortOrder((p) => (p === "asc" ? "desc" : "asc"))}
              className="rounded-lg border border-white/10 bg-black/40 p-2 text-white hover:bg-white/10"
            >
              <ArrowUpDown className={`h-4 w-4 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="animate-pulse space-y-4 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-4 rounded bg-white/10" />
                <div className="h-16 w-12 rounded bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-white/10" />
                  <div className="h-3 w-1/4 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.size === paginatedItems.length && paginatedItems.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-600 bg-black/40 text-purple-600 focus:ring-purple-500"
                />
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Series</th>
              <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Seasons</th>
              <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Episodes</th>
              <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Rating</th>
              <th className="p-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Category</th>
              <th className="p-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => (
              <tr key={item._id || item.slug} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item._id || "")}
                    onChange={() => toggleSelect(item._id || "")}
                    className="h-4 w-4 rounded border-gray-600 bg-black/40 text-purple-600 focus:ring-purple-500"
                  />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {item.poster ? (
                      <Image src={item.poster} alt={item.title} width={45} height={65} className="h-[65px] w-[45px] rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-[65px] w-[45px] items-center justify-center rounded-lg bg-black/40">
                        <Tv className="h-6 w-6 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white line-clamp-1">{item.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.year} · {item.language}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-300 hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    <Layers className="h-3 w-3 text-purple-400" />
                    {item.seasons?.length || 0}
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-300 hidden lg:table-cell">
                  <div className="flex items-center gap-1">
                    <Film className="h-3 w-3 text-gray-500" />
                    {getTotalEpisodes(item)}
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-300 hidden sm:table-cell">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {item.rating?.toFixed(1)}
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-300 hidden md:table-cell">{item.category}</td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/edit/${item._id || item.slug}`}
                      className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => deleteContent(item._id)}
                      className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Tv className="h-16 w-16 text-gray-700" />
            <p className="mt-4 text-lg font-medium text-gray-400">No series found</p>
            <p className="text-sm text-gray-600">Add your first series or adjust your search</p>
          </div>
        )}
      </div>
      )}

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
  );
}
