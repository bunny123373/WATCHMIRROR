"use client";

import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

export default function MyListRow() {
  const items = useAppSelector((state) => state.myList.items);
  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-[var(--font-heading)] text-xl text-white md:text-2xl">My List</h2>
      <div className="scrollbar-thin snap-x snap-mandatory flex gap-3 overflow-x-auto pb-4 scroll-smooth will-change-transform">
        {items.map((item) => {
          const href = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
          const hasValidPoster =
            typeof item.poster === "string" &&
            (item.poster.startsWith("/") || item.poster.startsWith("https://image.tmdb.org/"));
          return (
            <Link key={`${item.type}-${item.slug}`} href={href} className="group relative w-[130px] shrink-0 snap-start transition sm:w-[150px] md:w-[170px] lg:w-[190px]">
              <div className="relative overflow-hidden rounded-lg bg-[#0a0a0a] transition duration-300 group-hover:scale-105 group-hover:shadow-xl">
                {hasValidPoster ? (
                  <Image src={item.poster} alt={item.title} width={300} height={450} className="aspect-[2/3] w-full object-cover bg-[#1a1a1a]" />
                ) : (
                  <div className="aspect-[2/3] w-full bg-[#12151D]" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
                  <Play className="scale-0 text-white opacity-0 transition group-hover:scale-100 group-hover:opacity-100" size={32} fill="white" />
                </div>
              </div>
              <p className="mt-2 line-clamp-1 text-xs font-medium text-white sm:text-sm">{item.title}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
