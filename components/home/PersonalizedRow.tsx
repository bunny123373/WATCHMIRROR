"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { Content } from "@/types/content";

function scoreItem(item: Content, watched: Set<string>, preferredLanguage: string): number {
  let score = 0;
  if (watched.has(item.slug)) score -= 100;
  if (preferredLanguage && item.language?.toLowerCase() === preferredLanguage) score += 20;
  score += item.popularity || 0;
  score += (item.rating || 0) * 8;
  return score;
}

export default function PersonalizedRow() {
  const [items, setItems] = useState<Content[]>([]);
  const watchedItems = useAppSelector((state) => state.continue.items);

  useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/content", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    };
    run();
  }, []);

  const recommendations = useMemo(() => {
    if (!items.length) return [];
    const watchedSlugs = new Set(watchedItems.map((item) => item.slug));
    const preferredLanguage = (navigator.language || "en").slice(0, 2).toLowerCase();

    return [...items]
      .sort((a, b) => scoreItem(b, watchedSlugs, preferredLanguage) - scoreItem(a, watchedSlugs, preferredLanguage))
      .filter((item) => !watchedSlugs.has(item.slug))
      .slice(0, 12);
  }, [items, watchedItems]);

  if (!recommendations.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-[var(--font-heading)] text-2xl">Recommended For You</h2>
      <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
        {recommendations.map((item) => {
          const href = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
          const hasPoster =
            typeof item.poster === "string" &&
            (item.poster.startsWith("/") || item.poster.startsWith("https://image.tmdb.org/"));
          return (
            <Link key={`${item.type}-${item.slug}`} href={href} className="group block w-[150px] shrink-0 sm:w-[180px]">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-glass">
                {hasPoster ? (
                  <Image
                    src={item.poster}
                    alt={item.title}
                    width={360}
                    height={520}
                    className="aspect-[2/3] w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="aspect-[2/3] w-full bg-[#12151D]" />
                )}
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-black">{item.quality}</span>
              </div>
              <h3 className="mt-2 line-clamp-1 text-sm font-semibold text-text">{item.title}</h3>
              <p className="text-xs text-muted">
                {item.year} | {Number.isFinite(item.rating) ? item.rating.toFixed(1) : "N/A"}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
