"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { Content } from "@/types/content";

function scoreItem(
  item: Content,
  watched: Set<string>,
  preferredType: string,
  favoriteCategories: Set<string>,
  favoriteTags: Set<string>,
  favoriteLanguages: Set<string>
): number {
  let score = 0;
  if (watched.has(item.slug)) score -= 100;
  if (preferredType && item.type === preferredType) score += 24;
  if (favoriteCategories.has((item.category || "").toLowerCase())) score += 18;
  if (favoriteLanguages.has((item.language || "").toLowerCase())) score += 12;
  score += (item.tags || []).reduce((sum, tag) => sum + (favoriteTags.has(tag.toLowerCase()) ? 8 : 0), 0);
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
    if (!items.length || !watchedItems.length) return [];

    const watchedSlugs = new Set(watchedItems.map((item) => item.slug));
    const watchedContent = items.filter((item) => watchedSlugs.has(item.slug));

    if (!watchedContent.length) return [];

    const typeCounts = watchedContent.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    const preferredType =
      Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    const favoriteCategories = new Set(
      watchedContent.map((item) => (item.category || "").toLowerCase()).filter(Boolean)
    );
    const favoriteTags = new Set(
      watchedContent.flatMap((item) => (item.tags || []).map((tag) => tag.toLowerCase()))
    );
    const favoriteLanguages = new Set(
      watchedContent.map((item) => (item.language || "").toLowerCase()).filter(Boolean)
    );

    return [...items]
      .filter((item) => !watchedSlugs.has(item.slug))
      .sort(
        (a, b) =>
          scoreItem(b, watchedSlugs, preferredType, favoriteCategories, favoriteTags, favoriteLanguages) -
          scoreItem(a, watchedSlugs, preferredType, favoriteCategories, favoriteTags, favoriteLanguages)
      )
      .slice(0, 12);
  }, [items, watchedItems]);

  if (!recommendations.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-[var(--font-heading)] text-2xl text-white">Because You Watched</h2>
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
