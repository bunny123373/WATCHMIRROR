"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, Play, Plus } from "lucide-react";
import { Content } from "@/types/content";
import { useMyListSync } from "@/hooks/useMyListSync";

export default function ContentCard({ item }: { item: Content }) {
  const { isInList, toggleMyList } = useMyListSync();

  const detailsHref = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
  const watchHref = item.type === "movie" ? `/watch/${item.slug}` : `/series/watch/${item.slug}`;
  const hasValidPoster =
    typeof item.poster === "string" &&
    (item.poster.startsWith("/") || item.poster.startsWith("https://image.tmdb.org/"));
  const yearLabel = Number.isFinite(item.year) ? String(item.year) : "N/A";
  const ratingLabel = Number.isFinite(item.rating) ? item.rating.toFixed(1) : null;

  const inList = isInList(item.slug, item.type);

  return (
    <article className="group relative w-[110px] shrink-0 transition sm:w-[130px] md:w-[160px] lg:w-[180px] xl:w-[200px]">
      <div className="relative overflow-hidden rounded-lg bg-[#0a0a0a] transition duration-300 group-hover:scale-105 group-hover:shadow-xl">
        <Link href={detailsHref}>
          {hasValidPoster ? (
            <Image
              src={item.poster}
              alt={item.title}
              width={400}
              height={560}
              sizes="(max-width: 640px) 110px, (max-width: 768px) 130px, (max-width: 1024px) 160px, (max-width: 1280px) 180px, 200px"
              className="aspect-[2/3] w-full object-cover bg-[#1a1a1a]"
            />
          ) : (
            <div className="aspect-[2/3] w-full bg-[#12151D]" />
          )}
        </Link>
        
        {ratingLabel !== null && (
          <div className="absolute left-1.5 top-1.5 rounded bg-black/80 px-1.5 py-0.5">
            <span className="text-[10px] font-bold text-[#00f0ff]">{ratingLabel}</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-12">
          <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
            <Link href={watchHref} className="flex-1 flex items-center justify-center gap-1 rounded bg-white py-1 text-[10px] font-bold text-black">
              <Play size={10} /> Play
            </Link>
            <button
              type="button"
              onClick={() => toggleMyList({
                slug: item.slug,
                type: item.type,
                title: item.title,
                poster: item.poster,
                year: item.year,
                rating: item.rating,
                quality: item.quality
              })}
              className="flex items-center justify-center rounded border border-white/60 px-1.5 py-1 text-white"
            >
              {inList ? <Check size={10} /> : <Plus size={10} />}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-1.5 px-0.5">
        <h3 className="line-clamp-1 text-xs font-medium text-white group-hover:text-[#00f0ff] sm:text-sm">{item.title}</h3>
        <p className="mt-0.5 text-[10px] text-gray-400">
          {yearLabel} | {item.type === "movie" ? "Movie" : "Series"}
        </p>
      </div>
    </article>
  );
}
