"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Play, Star, ChevronRight } from "lucide-react";
import { Content } from "@/types/content";

export default function SeriesContent({
  searchParams
}: {
  searchParams: Promise<{ q?: string; language?: string; genre?: string; year?: string; sort?: string }>;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [catalog, setCatalog] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLanguage, setSelectedLanguage] = useState(params.get("language") || "");
  const [selectedGenre, setSelectedGenre] = useState(params.get("genre") || "");

  useEffect(() => {
    setLoading(true);
    fetch("/api/content", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        const series = (Array.isArray(data.items) ? data.items : []).filter((item: Content) => item.type === "series");
        setCatalog(series);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const query = new URLSearchParams();
    if (selectedLanguage) query.set("language", selectedLanguage);
    if (selectedGenre) query.set("genre", selectedGenre);
    router.replace(`/series?${query.toString()}`, { scroll: false });
  }, [selectedLanguage, selectedGenre, router]);

  const filtered = useMemo(() => {
    let result = [...catalog];

    if (selectedLanguage) {
      result = result.filter((item) => item.language.toLowerCase() === selectedLanguage.toLowerCase());
    }

    if (selectedGenre) {
      result = result.filter((item) =>
        item.category.toLowerCase() === selectedGenre.toLowerCase() ||
        item.tags.some((tag) => tag.toLowerCase() === selectedGenre.toLowerCase())
      );
    }

    return result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [catalog, selectedLanguage, selectedGenre]);

  const heroSeries = useMemo(() => {
    return [...catalog].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 5);
  }, [catalog]);

  const trending = filtered.slice(0, 10);
  const topRated = filtered.filter((item) => (item.rating || 0) >= 7).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);

  const languages = Array.from(new Set(catalog.map((item) => item.language).filter(Boolean))).sort();
  const genres = Array.from(new Set(catalog.flatMap((item) => [item.category, ...item.tags]))).filter(Boolean).sort();

  const [heroIndex, setHeroIndex] = useState(0);
  const heroSeriesItem = heroSeries[heroIndex];

  useEffect(() => {
    if (heroSeries.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSeries.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSeries.length]);

  return (
    <div className="min-h-screen bg-black">
      {!selectedLanguage && !selectedGenre && heroSeriesItem && (
        <section className="relative h-[70vh] w-full">
          <Image
            src={heroSeriesItem.banner || heroSeriesItem.poster}
            alt={heroSeriesItem.title}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-3 text-sm text-gray-300">
                <span className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400" fill="currentColor" />
                  {heroSeriesItem.rating?.toFixed(1)}
                </span>
                <span>{heroSeriesItem.year}</span>
                <span>{heroSeriesItem.language}</span>
                {heroSeriesItem.seasons && (
                  <span className="rounded bg-white/20 px-2 py-0.5 text-xs">
                    {heroSeriesItem.seasons.length} Season{heroSeriesItem.seasons.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <h1 className="mb-3 text-4xl font-bold text-white md:text-5xl">{heroSeriesItem.title}</h1>
              <p className="mb-4 line-clamp-2 text-gray-300">{heroSeriesItem.description}</p>
              <Link
                href={`/series/watch/${heroSeriesItem.slug}`}
                className="inline-flex items-center gap-2 rounded bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-white/90"
              >
                <Play size={20} fill="black" /> Watch Now
              </Link>
            </div>
          </div>

          <div className="absolute bottom-4 right-8 flex gap-2">
            {heroSeries.map((_, index) => (
              <button
                key={index}
                onClick={() => setHeroIndex(index)}
                className={`h-1 rounded-full transition ${
                  index === heroIndex ? "w-8 bg-white" : "w-4 bg-white/30"
                }`}
              />
            ))}
          </div>
        </section>
      )}

      <div className="px-4 py-6 md:px-8">
        <h1 className="mb-6 font-[var(--font-heading)] text-3xl text-white md:text-4xl">TV Shows</h1>

        <div className="mb-8 flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm text-gray-400">Language</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLanguage("")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  !selectedLanguage ? "bg-red-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                All
              </button>
              {languages.slice(0, 8).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang.toLowerCase())}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedLanguage === lang.toLowerCase()
                      ? "bg-red-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-gray-400">Genre</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGenre("")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  !selectedGenre ? "bg-red-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                All
              </button>
              {genres.slice(0, 10).map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre.toLowerCase())}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedGenre === genre.toLowerCase()
                      ? "bg-red-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(selectedLanguage || selectedGenre) && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-400">
            <span>Showing:</span>
            {selectedLanguage && <span className="rounded-full bg-white/10 px-3 py-1">{selectedLanguage}</span>}
            {selectedGenre && <span className="rounded-full bg-white/10 px-3 py-1">{selectedGenre}</span>}
            <span className="text-white">({filtered.length} shows)</span>
            <button
              onClick={() => { setSelectedLanguage(""); setSelectedGenre(""); }}
              className="text-red-500 hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No TV shows found</p>
          </div>
        ) : (
          <div className="space-y-12">
            {!selectedLanguage && !selectedGenre && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Trending TV Shows</h2>
                  <Link href="/trending?type=series" className="flex items-center gap-1 text-sm text-gray-400 hover:text-white">
                    View All <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {trending.slice(0, 5).map((item) => (
                    <Link
                      key={item.slug}
                      href={`/series/${item.slug}`}
                      className="group relative overflow-hidden rounded-lg"
                    >
                      <div className="relative aspect-[2/3]">
                        <Image
                          src={item.poster}
                          alt={item.title}
                          fill
                          className="object-cover transition group-hover:scale-105"
                        />
                        {item.seasons && (
                          <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                            {item.seasons.length} Season{item.seasons.length !== 1 ? "s" : ""}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100">
                          <div className="absolute bottom-0 p-3">
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                            <p className="text-xs text-gray-300">{item.year}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {!selectedLanguage && !selectedGenre && topRated.length > 0 && (
              <section>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white">Top Rated</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {topRated.slice(0, 5).map((item) => (
                    <Link
                      key={`rated-${item.slug}`}
                      href={`/series/${item.slug}`}
                      className="group relative overflow-hidden rounded-lg"
                    >
                      <div className="relative aspect-[2/3]">
                        <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs font-bold text-white">
                          <Star size={10} className="text-yellow-500" fill="currentColor" />
                          {item.rating?.toFixed(1)}
                        </div>
                        {item.seasons && (
                          <div className="absolute right-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs text-white">
                            {item.seasons.length} Season{item.seasons.length !== 1 ? "s" : ""}
                          </div>
                        )}
                        <Image
                          src={item.poster}
                          alt={item.title}
                          fill
                          className="object-cover transition group-hover:scale-105"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">
                  {selectedLanguage || selectedGenre ? `All TV Shows (${filtered.length})` : "All TV Shows"}
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {filtered.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/series/${item.slug}`}
                    className="group relative overflow-hidden rounded-lg"
                  >
                    <div className="relative aspect-[2/3]">
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
                      {item.seasons && (
                        <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                          {item.seasons.length} Season{item.seasons.length !== 1 ? "s" : ""}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100">
                        <div className="absolute bottom-0 p-3">
                          <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                          <p className="text-xs text-gray-300">{item.year}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
