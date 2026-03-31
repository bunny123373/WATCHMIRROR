"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Filter, SlidersHorizontal } from "lucide-react";
import { Content } from "@/types/content";

const sortOptions = [
  { value: "latest", label: "Latest" },
  { value: "rating", label: "Top Rated" },
  { value: "popular", label: "Most Popular" },
  { value: "year", label: "Year" }
];

const typeOptions = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "series", label: "Series" }
];

export default function SearchContent({
  searchParams
}: {
  searchParams: Promise<{ q?: string; language?: string; genre?: string; year?: string; sort?: string; type?: string }>;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [catalog, setCatalog] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [q, setQ] = useState(params.get("q") || "");
  const [language, setLanguage] = useState(params.get("language") || "");
  const [genre, setGenre] = useState(params.get("genre") || "");
  const [year, setYear] = useState(params.get("year") || "");
  const [sort, setSort] = useState(params.get("sort") || "latest");
  const [type, setType] = useState(params.get("type") || "all");

  useEffect(() => {
    setLoading(true);
    fetch("/api/content", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setCatalog(Array.isArray(data.items) ? data.items : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (language) query.set("language", language);
    if (genre) query.set("genre", genre);
    if (year) query.set("year", year);
    if (sort !== "latest") query.set("sort", sort);
    if (type !== "all") query.set("type", type);
    router.replace(`/search?${query.toString()}`, { scroll: false });
  }, [q, language, genre, year, sort, type, router]);

  const filtered = useMemo(() => {
    let result = [...catalog];
    
    if (type !== "all") {
      result = result.filter(item => item.type === type);
    }
    
    if (q.trim()) {
      const term = q.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.description.toLowerCase().includes(term) ||
        item.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    if (language) {
      result = result.filter(item => item.language.toLowerCase() === language);
    }
    
    if (genre) {
      result = result.filter(item => 
        item.category.toLowerCase() === genre ||
        item.tags.some(tag => tag.toLowerCase() === genre)
      );
    }
    
    if (year) {
      result = result.filter(item => item.year === Number(year));
    }
    
    result.sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "popular") return b.popularity - a.popularity;
      if (sort === "year") return b.year - a.year;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    
    return result;
  }, [catalog, q, language, genre, year, sort, type]);

  const languages = Array.from(new Set(catalog.map(item => item.language).filter(Boolean))).sort();
  const genres = Array.from(new Set(catalog.flatMap(item => [item.category, ...item.tags]))).filter(Boolean).sort();
  const years = Array.from(new Set(catalog.map(item => item.year))).filter(Boolean).sort((a, b) => b - a);

  const clearFilters = () => {
    setQ("");
    setLanguage("");
    setGenre("");
    setYear("");
    setSort("latest");
    setType("all");
  };

  const hasFilters = q || language || genre || year || type !== "all";

  return (
    <div className="w-full pb-12">
      <h1 className="mb-6 font-[var(--font-heading)] text-3xl text-white md:text-4xl">Search</h1>
      
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search movies, series..."
              className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-red-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${
              showFilters || hasFilters ? "border-red-500 bg-red-500/10 text-red-500" : "border-white/10 text-gray-300"
            }`}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-white"
                >
                  {typeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-white"
                >
                  <option value="">All Languages</option>
                  {languages.map(lang => (
                    <option key={lang} value={lang.toLowerCase()}>{lang}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-white"
                >
                  <option value="">All Genres</option>
                  {genres.map(g => (
                    <option key={g} value={g.toLowerCase()}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-white"
                >
                  <option value="">All Years</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-4">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-white sm:w-48"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-6 flex items-center gap-1 text-sm text-gray-400 hover:text-white"
                >
                  <X size={14} /> Clear filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {hasFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-400">
          <span>Results:</span>
          {type !== "all" && <span className="rounded-full bg-white/10 px-3 py-1">{type}</span>}
          {language && <span className="rounded-full bg-white/10 px-3 py-1">{language}</span>}
          {genre && <span className="rounded-full bg-white/10 px-3 py-1">{genre}</span>}
          {year && <span className="rounded-full bg-white/10 px-3 py-1">{year}</span>}
          {q && <span className="rounded-full bg-white/10 px-3 py-1">"{q}"</span>}
          <span className="text-white">({filtered.length})</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">No results found</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 text-red-500 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {filtered.map((item) => (
            <Link
              key={`${item.slug}-${item.type}`}
              href={item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`}
              className="group relative overflow-hidden rounded-lg"
            >
              <div className="aspect-[2/3] w-full">
                {item.poster ? (
                  <Image
                    src={item.poster}
                    alt={item.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a] text-gray-500">
                    No Image
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100">
                <div className="absolute bottom-0 p-3">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-gray-300">{item.year} · {item.type === "movie" ? "Movie" : "Series"}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
