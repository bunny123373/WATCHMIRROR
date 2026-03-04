"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setMobileSearchOpen, setSearchTerm } from "@/store/slices/uiSlice";
import { Content } from "@/types/content";

const RECENT_KEY = "wm_recent_searches";
const suggestionPills = ["Action", "Thriller", "K-Drama", "Tamil", "Top Rated"];

export default function MobileSearchOverlay() {
  const dispatch = useAppDispatch();
  const { mobileSearchOpen, searchTerm } = useAppSelector((state) => state.ui);
  const [catalog, setCatalog] = useState<Content[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mobileSearchOpen) return;

    const saved =
      typeof window !== "undefined"
        ? JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]")
        : [];
    setRecent(Array.isArray(saved) ? saved.slice(0, 6) : []);

    if (catalog.length) return;
    setLoading(true);
    fetch("/api/content", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setCatalog(Array.isArray(data.items) ? data.items : []))
      .finally(() => setLoading(false));
  }, [mobileSearchOpen, catalog.length]);

  useEffect(() => {
    if (!mobileSearchOpen) return;

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch(setMobileSearchOpen(false));
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEsc);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEsc);
    };
  }, [mobileSearchOpen, dispatch]);

  const debouncedTerm = useDebounced(searchTerm, 250);

  const filtered = useMemo(() => {
    if (!debouncedTerm.trim()) return [];
    const term = debouncedTerm.toLowerCase();
    return [...catalog]
      .filter((item) => item.title.toLowerCase().includes(term) || item.description.toLowerCase().includes(term) || item.tags.some((tag) => tag.toLowerCase().includes(term)))
      .sort((a, b) => {
        const aStarts = a.title.toLowerCase().startsWith(term) ? 1 : 0;
        const bStarts = b.title.toLowerCase().startsWith(term) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;
        return b.popularity - a.popularity;
      })
      .slice(0, 12);
  }, [catalog, debouncedTerm]);

  const persistSearch = (query: string) => {
    const normalized = query.trim();
    if (!normalized || typeof window === "undefined") return;
    const next = [normalized, ...recent.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 6);
    setRecent(next);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  return (
    <AnimatePresence>
      {mobileSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => dispatch(setMobileSearchOpen(false))}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="glass mx-auto h-full max-w-2xl overflow-hidden rounded-2xl md:my-20 md:h-auto md:max-h-[80vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-[#0a0a0a]/95 p-4 backdrop-blur">
              <Search size={20} className="text-gray-400" />
              <input
                autoFocus
                value={searchTerm}
                onChange={(event) => dispatch(setSearchTerm(event.target.value))}
                placeholder="Search movies, series..."
                className="flex-1 bg-transparent text-base text-white placeholder-gray-500 outline-none"
              />
              <button onClick={() => dispatch(setMobileSearchOpen(false))} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              {!searchTerm.trim() && (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Quick Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestionPills.map((pill) => (
                        <button
                          key={pill}
                          type="button"
                          onClick={() => dispatch(setSearchTerm(pill))}
                          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                        >
                          {pill}
                        </button>
                      ))}
                    </div>
                  </div>
                  {!!recent.length && (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Recent</p>
                      <div className="flex flex-wrap gap-2">
                        {recent.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => dispatch(setSearchTerm(item))}
                            className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 space-y-2">
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Search size={14} className="animate-pulse" /> Searching...
                  </div>
                )}
                {filtered.map((item) => (
                  <Link
                    key={`${item.slug}-${item.type}`}
                    href={item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`}
                    onClick={() => {
                      persistSearch(searchTerm);
                      dispatch(setMobileSearchOpen(false));
                    }}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
                  >
                    {item.poster ? (
                      <Image src={item.poster} alt={item.title} width={48} height={64} className="h-16 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="h-16 w-12 rounded-lg bg-gray-800" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-gray-400">
                        {item.type === "movie" ? "Movie" : "Series"} · {item.year} · {item.rating?.toFixed(1)}
                      </p>
                    </div>
                  </Link>
                ))}
                {!!searchTerm.trim() && !filtered.length && !loading && (
                  <p className="py-8 text-center text-sm text-gray-500">No results found for "{searchTerm}"</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useDebounced(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}
