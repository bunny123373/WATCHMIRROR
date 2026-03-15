"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Flame, Star, TrendingUp, Film, Tv, Calendar } from "lucide-react";
import { Content } from "@/types/content";

const timeFilters = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" }
];

const typeFilters = [
  { value: "all", label: "All", icon: Flame },
  { value: "movie", label: "Movies", icon: Film },
  { value: "series", label: "Series", icon: Tv }
];

export default function TrendingContent({
  searchParams
}: {
  searchParams: Promise<{ time?: string; type?: string }>;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [catalog, setCatalog] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  const [time, setTime] = useState(params.get("time") || "week");
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
    if (time !== "week") query.set("time", time);
    if (type !== "all") query.set("type", type);
    router.replace(`/trending?${query.toString()}`, { scroll: false });
  }, [time, type, router]);

  const filtered = useMemo(() => {
    let result = [...catalog];

    if (type !== "all") {
      result = result.filter((item) => item.type === type);
    }

    result.sort((a, b) => {
      if (time === "week") {
        const aScore = (a.popularity || 0) * 0.7 + (a.rating || 0) * 30;
        const bScore = (b.popularity || 0) * 0.7 + (b.rating || 0) * 30;
        return bScore - aScore;
      }
      if (time === "month") {
        const aScore = (a.popularity || 0) * 0.8 + (a.rating || 0) * 20;
        const bScore = (b.popularity || 0) * 0.8 + (b.rating || 0) * 20;
        return bScore - aScore;
      }
      return (b.popularity || 0) - (a.popularity || 0);
    });

    return result;
  }, [catalog, time, type]);

  const trending = filtered.slice(0, 10);
  const topRated = filtered
    .filter((item) => (item.rating || 0) >= 7)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);
  const popular = filtered
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12">
      <div className="mb-6 flex items-center gap-3">
        <TrendingUp className="text-red-500" size={28} />
        <h1 className="font-[var(--font-heading)] text-3xl text-white md:text-4xl">Trending</h1>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {typeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setType(filter.value)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                type === filter.value
                  ? "bg-red-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              <filter.icon size={16} />
              <span className="hidden sm:inline">{filter.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {timeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTime(filter.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                time === filter.value
                  ? "bg-white text-black"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-12">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Flame className="text-orange-500" size={20} />
              <h2 className="text-xl font-bold text-white">Top 10 Trending {type === "all" ? "" : type === "movie" ? "Movies" : "Series"}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {trending.map((item, index) => (
                <Link
                  key={`${item.slug}-${item.type}`}
                  href={item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`}
                  className="group relative overflow-hidden rounded-lg"
                >
                  <div className="relative aspect-[2/3] w-full">
                    {index < 3 && (
                      <div className={`absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded font-bold text-white ${
                        index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-amber-700"
                      }`}>
                        #{index + 1}
                      </div>
                    )}
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

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Star className="text-yellow-500" size={20} />
              <h2 className="text-xl font-bold text-white">Top Rated</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {topRated.map((item, index) => (
                <Link
                  key={`rated-${item.slug}-${item.type}`}
                  href={item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`}
                  className="group relative overflow-hidden rounded-lg"
                >
                  <div className="relative aspect-[2/3] w-full">
                    <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs font-bold text-white">
                      <Star size={10} className="text-yellow-500" fill="currentColor" />
                      {item.rating?.toFixed(1)}
                    </div>
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
                  <p className="mt-2 truncate text-sm text-white group-hover:text-red-500">{item.title}</p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Flame className="text-red-500" size={20} />
              <h2 className="text-xl font-bold text-white">Most Popular</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {popular.map((item, index) => (
                <Link
                  key={`popular-${item.slug}-${item.type}`}
                  href={item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`}
                  className="group relative overflow-hidden rounded-lg"
                >
                  <div className="relative aspect-[2/3] w-full">
                    {index < 10 && (
                      <div className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded bg-red-600 text-xs font-bold text-white">
                        {index + 1}
                      </div>
                    )}
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
                  <p className="mt-2 truncate text-sm text-white group-hover:text-red-500">{item.title}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
