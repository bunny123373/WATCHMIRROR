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
          className="fixed inset-0 z-[70] bg-black/80 p-4 md:hidden"
          onClick={() => dispatch(setMobileSearchOpen(false))}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass mx-auto h-full max-w-4xl rounded-2xl p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-[var(--font-heading)] text-lg">Search</h3>
              <button onClick={() => dispatch(setMobileSearchOpen(false))}>
                <X size={18} />
              </button>
            </div>

            <input
              autoFocus
              value={searchTerm}
              onChange={(event) => dispatch(setSearchTerm(event.target.value))}
              placeholder="Search movies, series, genres..."
              className="w-full rounded-xl border border-border bg-black/30 px-4 py-3 text-sm outline-none ring-primary/50 focus:ring"
            />

            {!searchTerm.trim() && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-widest text-muted">Suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestionPills.map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => dispatch(setSearchTerm(pill))}
                        className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>
                {!!recent.length && (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-widest text-muted">Recent</p>
                    <div className="flex flex-wrap gap-2">
                      {recent.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => dispatch(setSearchTerm(item))}
                          className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 space-y-3 overflow-y-auto">
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Search size={14} className="animate-pulse" /> Searching catalog...
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
                  className="flex items-center gap-3 rounded-xl border border-border bg-black/20 p-2"
                >
                  <Image src={item.poster} alt={item.title} width={56} height={72} className="rounded-lg object-cover" />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted">
                      {item.type.toUpperCase()} | {item.year}
                    </p>
                  </div>
                </Link>
              ))}
              {!!searchTerm.trim() && !filtered.length && <p className="text-sm text-muted">No matching content found.</p>}
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
