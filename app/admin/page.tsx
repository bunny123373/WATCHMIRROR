"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Content } from "@/types/content";

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

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<Partial<Content>>(emptyPayload);
  const [status, setStatus] = useState("");

  const slugPreview = useMemo(() => {
    return (payload.title || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }, [payload.title]);

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
    setPayload((prev) => ({ ...prev, ...data.details }));
    setLoading(false);
  };

  const submitContent = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("Saving...");

    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey
      },
      body: JSON.stringify({
        ...payload,
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

    setPayload(emptyPayload);
    setStatus("Content saved successfully.");
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

      <section className="glass rounded-2xl p-4">
        <h2 className="mb-3 text-lg font-semibold">TMDB Auto Import</h2>
        <div className="flex gap-2">
          <input
            value={tmdbQuery}
            onChange={(e) => setTmdbQuery(e.target.value)}
            placeholder="Search movie or series"
            className="flex-1 rounded-xl border border-border bg-black/20 px-4 py-2 text-sm"
          />
          <button onClick={searchTMDB} className="rounded-xl border border-border px-4 py-2 text-sm">
            <Search size={16} />
          </button>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {tmdbResults.map((item) => (
            <button
              key={`${item.mediaType}-${item.id}`}
              onClick={() => importTMDB(item.id, item.mediaType)}
              className="rounded-xl border border-border p-3 text-left hover:border-primary"
            >
              <p className="font-semibold">{item.title}</p>
              <p className="text-xs text-muted">{item.mediaType.toUpperCase()} | {item.year || "-"}</p>
            </button>
          ))}
        </div>
        {loading && <p className="mt-2 text-xs text-muted">Loading...</p>}
      </section>

      <form onSubmit={submitContent} className="glass grid gap-4 rounded-2xl p-4 md:grid-cols-2">
        <input value={payload.title || ""} onChange={(e) => setPayload({ ...payload, title: e.target.value })} placeholder="Title" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" required />
        <select value={payload.type} onChange={(e) => setPayload({ ...payload, type: e.target.value as "movie" | "series" })} className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm">
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
        <input value={payload.hlsLink || ""} onChange={(e) => setPayload({ ...payload, hlsLink: e.target.value })} placeholder="HLS Link" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
        <input value={payload.embedIframeLink || ""} onChange={(e) => setPayload({ ...payload, embedIframeLink: e.target.value })} placeholder="Embed Iframe Link" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm" />
        <input value={payload.trailerEmbedUrl || ""} onChange={(e) => setPayload({ ...payload, trailerEmbedUrl: e.target.value })} placeholder="Trailer Embed URL" className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm md:col-span-2" />
        <input
          value={Array.isArray(payload.tags) ? payload.tags.join(", ") : ""}
          onChange={(e) => setPayload({ ...payload, tags: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
          placeholder="Tags (comma separated)"
          className="rounded-xl border border-border bg-black/20 px-4 py-2 text-sm md:col-span-2"
        />
        <textarea value={payload.description || ""} onChange={(e) => setPayload({ ...payload, description: e.target.value })} placeholder="Description" className="min-h-[120px] rounded-xl border border-border bg-black/20 px-4 py-2 text-sm md:col-span-2" required />

        <p className="text-xs text-muted md:col-span-2">Slug preview: {slugPreview || "-"}</p>

        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-black md:col-span-2">
          <Plus size={16} /> Save Content
        </button>
        <p className="text-sm text-muted md:col-span-2">{status}</p>
      </form>
    </div>
  );
}
