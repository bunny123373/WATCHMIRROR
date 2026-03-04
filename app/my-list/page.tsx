"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeMyList } from "@/store/slices/myListSlice";

export default function MyListPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.myList.items);

  return (
    <div className="space-y-6">
      <h1 className="font-[var(--font-heading)] text-3xl text-white md:text-4xl">My List</h1>
      
      {!items.length ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-400">Your list is empty</p>
            <p className="mt-2 text-sm text-gray-500">Save movies and TV shows to watch later</p>
          </div>
        </div>
      ) : (
        <div className="scrollbar-thin snap-x snap-mandatory flex gap-3 overflow-x-auto pb-4 scroll-smooth">
          {items.map((item) => {
            const href = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
            const hasValidPoster =
              typeof item.poster === "string" &&
              (item.poster.startsWith("/") || item.poster.startsWith("https://image.tmdb.org/"));
            return (
              <div key={`${item.type}-${item.slug}`} className="group relative w-[130px] shrink-0 snap-start sm:w-[150px] md:w-[170px] lg:w-[190px]">
                <Link href={href} className="block">
                  <div className="relative overflow-hidden rounded-lg bg-[#0a0a0a] transition duration-300 group-hover:scale-105 group-hover:shadow-xl">
                    {hasValidPoster ? (
                      <Image src={item.poster} alt={item.title} width={300} height={450} className="aspect-[2/3] w-full object-cover" />
                    ) : (
                      <div className="aspect-[2/3] w-full bg-[#12151D]" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/50">
                      <Play className="scale-0 text-white opacity-0 transition group-hover:scale-100 group-hover:opacity-100" size={32} fill="white" />
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-1 text-xs font-medium text-white sm:text-sm">{item.title}</p>
                </Link>
                <button
                  type="button"
                  onClick={() => dispatch(removeMyList({ slug: item.slug, type: item.type }))}
                  className="absolute -top-2 -right-2 hidden rounded-full bg-red-600 p-1.5 text-white opacity-0 transition hover:bg-red-700 group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
