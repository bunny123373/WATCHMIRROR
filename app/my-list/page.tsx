"use client";

import Link from "next/link";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeMyList } from "@/store/slices/myListSlice";

export default function MyListPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.myList.items);

  return (
    <div className="space-y-6">
      <h1 className="font-[var(--font-heading)] text-4xl">My List</h1>
      {!items.length && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#181818] p-6 text-sm text-[#b3b3b3]">No saved titles yet.</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
        {items.map((item) => {
          const href = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
          const hasValidPoster =
            typeof item.poster === "string" &&
            (item.poster.startsWith("/") || item.poster.startsWith("https://image.tmdb.org/"));
          return (
            <div key={`${item.type}-${item.slug}`} className="rounded-xl border border-[#2a2a2a] bg-[#181818] p-2">
              <Link href={href}>
                {hasValidPoster ? (
                  <Image src={item.poster} alt={item.title} width={300} height={450} className="aspect-[2/3] w-full rounded-lg object-cover" />
                ) : (
                  <div className="aspect-[2/3] w-full rounded-lg bg-[#12151D]" />
                )}
                <p className="mt-2 line-clamp-1 text-sm font-semibold">{item.title}</p>
              </Link>
              <button
                type="button"
                onClick={() => dispatch(removeMyList({ slug: item.slug, type: item.type }))}
                className="mt-1 text-xs text-[#b3b3b3] hover:text-[#E50914]"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
