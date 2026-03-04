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
  const ratingLabel = ratingPercent !== null ? `${ratingPercent}%` : "N/A";
  const topTags = (item.tags || []).slice(0, 3).join(" | ");

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
    <article className="group relative w-[170px] shrink-0 transition sm:w-[210px] md:w-[230px]">
      <div className="relative overflow-hidden rounded-xl border border-[#202020] bg-[#141414] transition duration-300 group-hover:z-20 group-hover:scale-[1.08] group-hover:border-[#343434] group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.55)]">
        <Link href={detailsHref}>
          {hasValidPoster ? (
            <Image
              src={item.poster}
              alt={item.title}
              width={400}
              height={560}
              className="aspect-[2/3] w-full object-cover transition duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="aspect-[2/3] w-full bg-[#12151D]" />
          )}
        </Link>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-white">{item.title}</h3>
          <p className="mt-1 text-[11px] text-[#D1D5DB]">
            {yearLabel} | {ratingLabel} | {item.type === "movie" ? "Movie" : "Series"}
          </p>
          {topTags && <p className="mt-1 line-clamp-1 text-[10px] text-[#A1A1AA]">{topTags}</p>}
          <div className="mt-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
            <Link href={watchHref} className="inline-flex items-center gap-1 rounded bg-white/95 px-2 py-1 text-[10px] font-bold text-black">
              <Play size={11} /> Play
            </Link>
            <button
              type="button"
              onClick={toggleList}
              className="inline-flex items-center gap-1 rounded border border-white/40 px-2 py-1 text-[10px] font-semibold text-white"
            >
              {isInList ? <Check size={11} /> : <Plus size={11} />}
              {isInList ? "In List" : "My List"}
            </button>
          </div>
        </div>
        <span className="absolute left-2 top-2 rounded bg-[#E50914] px-2 py-1 text-[10px] font-bold text-white">{item.quality}</span>
      </div>

      <div className="pointer-events-none absolute left-0 right-0 top-[calc(100%-10px)] hidden rounded-xl border border-[#2a2a2a] bg-[#181818] p-3 opacity-0 shadow-[0_18px_30px_rgba(0,0,0,0.55)] transition duration-300 group-hover:pointer-events-auto group-hover:opacity-100 md:block">
        <p className="line-clamp-1 text-sm font-semibold text-white">{item.title}</p>
        <p className="mt-1 line-clamp-2 text-xs text-[#b3b3b3]">{item.description || "No description available."}</p>
        <div className="mt-2 flex gap-2">
          <Link href={watchHref} className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[10px] font-bold text-black">
            <Play size={11} /> Play
          </Link>
          <button
            type="button"
            onClick={toggleList}
            className="inline-flex items-center gap-1 rounded border border-[#3a3a3a] px-2 py-1 text-[10px] font-semibold text-white"
          >
            {isInList ? <Check size={11} /> : <Plus size={11} />}
            {isInList ? "Saved" : "My List"}
          </button>
        </div>
      </div>
    </article>
  );
}
