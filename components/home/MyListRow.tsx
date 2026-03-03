"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeMyList } from "@/store/slices/myListSlice";

export default function MyListRow() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.myList.items);
  if (!items.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-[var(--font-heading)] text-2xl">My List</h2>
      <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => {
          const href = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
          const hasValidPoster =
            typeof item.poster === "string" &&
            (item.poster.startsWith("/") || item.poster.startsWith("https://image.tmdb.org/"));
          return (
            <div key={`${item.type}-${item.slug}`} className="w-[180px] shrink-0">
              <Link href={href}>
                <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#181818]">
                  {hasValidPoster ? (
                    <Image src={item.poster} alt={item.title} width={360} height={520} className="aspect-[2/3] w-full object-cover" />
                  ) : (
                    <div className="aspect-[2/3] w-full bg-[#12151D]" />
                  )}
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-semibold">{item.title}</p>
              </Link>
              <button
                type="button"
                onClick={() => dispatch(removeMyList({ slug: item.slug, type: item.type }))}
                className="mt-1 inline-flex items-center gap-1 text-xs text-[#b3b3b3] hover:text-[#E50914]"
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
