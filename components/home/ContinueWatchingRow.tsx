"use client";

import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

export default function ContinueWatchingRow() {
  const items = useAppSelector((state) => state.continue.items);
  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-[var(--font-heading)] text-xl text-white md:text-2xl">Continue Watching</h2>
      <div className="scrollbar-thin snap-x snap-mandatory flex gap-3 overflow-x-auto pb-4 scroll-smooth">
        {items.map((item) => {
          const href = item.type === "movie" ? `/watch/${item.slug}` : `/series/watch/${item.slug}`;
          const progress = Math.min(100, Math.round((item.currentTime / item.duration) * 100));

          return (
            <Link key={`${item.slug}-${item.episodeNumber || 0}`} href={href} className="group relative w-[130px] shrink-0 snap-start transition sm:w-[150px] md:w-[170px] lg:w-[190px]">
              <div className="relative overflow-hidden rounded-lg bg-[#0a0a0a] transition duration-300 group-hover:scale-105 group-hover:shadow-xl">
                <Image src={item.poster} alt={item.title} width={300} height={450} className="aspect-[2/3] w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
                  <Play className="scale-0 text-white opacity-0 transition group-hover:scale-100 group-hover:opacity-100" size={32} fill="white" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
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
