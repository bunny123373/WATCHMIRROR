"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Content, ContentType, Season } from "@/types/content";

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
  seasons: []
};

const defaultSeasonTemplate = JSON.stringify(
  [
    {
      seasonNumber: 1,
      episodes: [
        {
          episodeNumber: 1,
          episodeTitle: "Episode 1",
          hlsLink: "",
          embedIframeLink: "",
          quality: "HD"
        }
      ]
    }
  ],
  null,
  2
);

export default function AdminPage() {
  const [mode, setMode] = useState<ContentType>("movie");
  const [adminKey, setAdminKey] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<Partial<Content>>(emptyPayload);
  const [seasonsInput, setSeasonsInput] = useState(defaultSeasonTemplate);
  const [items, setItems] = useState<Content[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");

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

  const searchResults = useMemo(() => {
    const expected = mode === "movie" ? "movie" : "tv";
    return tmdbResults.filter((item) => item.mediaType === expected);
  }, [tmdbResults, mode]);

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
    setSeasonsInput(JSON.stringify(details.seasons || [], null, 2) || "[]");
    setLoading(false);
  };

  const startEdit = (item: Content) => {
    setEditingId(item._id || null);
    applyMode(item.type);
    setPayload({
      ...item,
      type: item.type
    });
    setSeasonsInput(JSON.stringify(item.seasons || [], null, 2));
    setStatus(`Editing: ${item.title}`);
  };

  const resetForm = () => {
    setEditingId(null);
    setPayload({ ...emptyPayload, type: mode });
    setSeasonsInput(defaultSeasonTemplate);
  };

  const submitContent = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("Saving...");

    let parsedSeasons: Season[] = [];
    if (mode === "series") {
      try {
        const parsed = JSON.parse(seasonsInput || "[]");
        if (!Array.isArray(parsed)) {
          setStatus("Invalid seasons JSON. Expected an array.");
          return;
        }
        parsedSeasons = parsed as Season[];
      } catch {
        setStatus("Invalid seasons JSON format.");
        return;
      }
    }

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
        <input value={payload.banner || ""} onChange={(e) => setPayload({ ...payload, banner: e.target.value })} placeholder="Banner URL" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" required />
        <input value={String(payload.year || "")} onChange={(e) => setPayload({ ...payload, year: Number(e.target.value) })} placeholder="Year" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" required />
        <input value={payload.language || ""} onChange={(e) => setPayload({ ...payload, language: e.target.value })} placeholder="Language" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
        <input value={payload.category || ""} onChange={(e) => setPayload({ ...payload, category: e.target.value })} placeholder="Category" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
        <input value={payload.quality || ""} onChange={(e) => setPayload({ ...payload, quality: e.target.value })} placeholder="Quality" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
        <input value={String(payload.rating || 0)} onChange={(e) => setPayload({ ...payload, rating: Number(e.target.value) })} placeholder="Rating" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
        <input value={String(payload.popularity || 0)} onChange={(e) => setPayload({ ...payload, popularity: Number(e.target.value) })} placeholder="Popularity" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
        {mode === "movie" ? (
          <>
            <input value={payload.hlsLink || ""} onChange={(e) => setPayload({ ...payload, hlsLink: e.target.value })} placeholder="HLS Link" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
            <input value={payload.embedIframeLink || ""} onChange={(e) => setPayload({ ...payload, embedIframeLink: e.target.value })} placeholder="Embed Iframe Link" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
          </>
        ) : (
          <textarea
            value={seasonsInput}
            onChange={(e) => setSeasonsInput(e.target.value)}
            placeholder="Seasons JSON"
            className="min-h-[160px] rounded-xl border border-border bg-black/20 px-4 py-2 text-sm md:col-span-2"
          />
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
        <h2 className="mb-3 text-lg font-semibold">{mode === "movie" ? "Recent Movies" : "Recent Series"}</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {filteredItems.slice(0, 20).map((item) => (
            <div key={item._id || item.slug} className="flex gap-3 rounded-xl border border-border p-3">
              {item.poster ? (
                <Image src={item.poster} alt={item.title} width={56} height={80} className="h-20 w-14 rounded-md object-cover" />
              ) : (
                <div className="h-20 w-14 rounded-md bg-black/30" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{item.title}</p>
                <p className="text-xs text-muted">
                  {item.type.toUpperCase()} | {item.year} | {item.language}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:border-primary"
                  >
                    <Pencil size={13} /> Edit
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
      </section>
    </div>
  );
}
