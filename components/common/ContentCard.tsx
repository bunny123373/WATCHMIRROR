"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, Play, Plus } from "lucide-react";
import { Content } from "@/types/content";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleMyList } from "@/store/slices/myListSlice";

export default function ContentCard({ item }: { item: Content }) {
  const dispatch = useAppDispatch();
  const myList = useAppSelector((state) => state.myList.items);
  const isInList = myList.some((saved) => saved.slug === item.slug && saved.type === item.type);

  const detailsHref = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
  const watchHref = item.type === "movie" ? `/watch/${item.slug}` : `/series/watch/${item.slug}`;
  const hasValidPoster =
    typeof item.poster === "string" &&
    (item.poster.startsWith("/") || item.poster.startsWith("https://image.tmdb.org/"));
  const yearLabel = Number.isFinite(item.year) ? String(item.year) : "N/A";
  const ratingPercent = Number.isFinite(item.rating) ? Math.round(item.rating * 10) : null;

  const toggleList = () => {
    dispatch(
      toggleMyList({
        slug: item.slug,
        type: item.type,
        title: item.title,
        poster: item.poster,
        year: item.year,
        rating: item.rating,
        quality: item.quality
      })
    );
  };

  return (
    <article className="group relative w-[150px] shrink-0 transition sm:w-[180px] md:w-[200px] lg:w-[220px]">
      <div className="relative overflow-hidden rounded-lg bg-[#0a0a0a] transition duration-300 group-hover:z-20 group-hover:scale-[1.04] group-hover:shadow-2xl">
        <Link href={detailsHref}>
          {hasValidPoster ? (
            <Image
              src={item.poster}
              alt={item.title}
              width={400}
              height={560}
              className="aspect-[2/3] w-full object-cover"
            />
          ) : (
            <div className="aspect-[2/3] w-full bg-[#12151D]" />
          )}
        </Link>
        
        {ratingPercent !== null && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5">
            <span className="text-[11px] font-bold text-[#00f0ff]">{ratingPercent}%</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 pt-16">
          <div className="flex gap-1.5 opacity-0 transition group-hover:opacity-100">
            <Link href={watchHref} className="flex-1 flex items-center justify-center gap-1 rounded bg-white py-1.5 text-[11px] font-bold text-black">
              <Play size={12} /> Play
            </Link>
            <button
              type="button"
              onClick={toggleList}
              className="flex items-center justify-center rounded border border-white/60 px-2 py-1.5 text-white"
            >
              {isInList ? <Check size={12} /> : <Plus size={12} />}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2 px-1">
        <h3 className="line-clamp-1 text-sm font-medium text-white group-hover:text-[#00f0ff]">{item.title}</h3>
        <p className="mt-0.5 text-[11px] text-gray-400">
          {yearLabel} · {item.type === "movie" ? "Movie" : "Series"}
        </p>
      </div>
    </article>
  );
}
