"use client";

import Link from "next/link";
import Image from "next/image";
import { useAppSelector } from "@/store/hooks";

export default function ContinueWatchingRow() {
  const items = useAppSelector((state) => state.continue.items);
  if (!items.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-[var(--font-heading)] text-2xl">Continue Watching</h2>
      <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => {
          const href = item.type === "movie" ? `/watch/${item.slug}` : `/series/watch/${item.slug}`;
          const progress = Math.min(100, Math.round((item.currentTime / item.duration) * 100));

          return (
            <Link key={`${item.slug}-${item.episodeNumber || 0}`} href={href} className="w-[180px] shrink-0">
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <Image src={item.poster} alt={item.title} width={360} height={520} className="aspect-[2/3] w-full object-cover" />
                <div className="p-2">
                  <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-black/40">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}