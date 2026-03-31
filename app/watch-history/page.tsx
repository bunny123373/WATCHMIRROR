"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Clock, Trash2 } from "lucide-react";
import { Content } from "@/types/content";
import { useAuth } from "@/components/providers/auth-provider";

interface WatchHistoryItem {
  contentId: string;
  progress: number;
  duration: number;
  updatedAt: string;
}

export default function WatchHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [contentMap, setContentMap] = useState<Record<string, Content>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetch("/api/watch-history")
      .then((res) => res.json())
      .then((data) => {
        setHistory(data.history || []);
        return data.history || [];
      })
      .then(async (items) => {
        if (items.length === 0) {
          setLoading(false);
          return;
        }
        const slugs = items.map((i: WatchHistoryItem) => i.contentId);
        const res = await fetch(`/api/content?slugs=${slugs.join(",")}`);
        const data = await res.json();
        const map: Record<string, Content> = {};
        (data.items || []).forEach((c: Content) => {
          map[c.slug] = c;
        });
        setContentMap(map);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const removeFromHistory = async (contentId: string) => {
    await fetch("/api/watch-history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId })
    });
    setHistory((prev) => prev.filter((h) => h.contentId !== contentId));
  };

  const clearAllHistory = async () => {
    for (const h of history) {
      await fetch("/api/watch-history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: h.contentId })
      });
    }
    setHistory([]);
  };

  if (!user) {
    return (
      <div className="py-12 text-center">
        <h1 className="mb-4 font-[var(--font-heading)] text-3xl text-white">Watch History</h1>
        <p className="text-gray-400">Sign in to view your watch history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-400">Loading...</div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-12 text-center">
        <h1 className="mb-4 font-[var(--font-heading)] text-3xl text-white">Watch History</h1>
        <p className="text-gray-400">No watch history yet</p>
        <Link href="/" className="mt-4 inline-block text-red-500 hover:underline">
          Start watching
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[var(--font-heading)] text-3xl text-white md:text-4xl">Watch History</h1>
        <button
          onClick={clearAllHistory}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-400 hover:text-white"
        >
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {history.map((item) => {
          const content = contentMap[item.contentId];
          if (!content) return null;

          const progressPercent = item.duration > 0 ? (item.progress / item.duration) * 100 : 0;

          return (
            <div
              key={item.contentId}
              className="group relative overflow-hidden rounded-lg bg-[#181818]"
            >
              <Link href={content.type === "movie" ? `/movie/${content.slug}` : `/series/${content.slug}`}>
                <div className="relative aspect-[16/9]">
                  {content.banner ? (
                    <Image
                      src={content.banner}
                      alt={content.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#1a1a1a] text-gray-500">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-white truncate">{content.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                    <span>{content.year}</span>
                    <span>•</span>
                    <span>{content.type === "movie" ? "Movie" : "Series"}</span>
                    {item.duration > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {Math.floor(item.progress / 60)}m
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeFromHistory(item.contentId);
                }}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-gray-400 opacity-0 transition hover:bg-red-600 hover:text-white group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
