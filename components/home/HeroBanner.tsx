import Link from "next/link";
import Image from "next/image";
import { Info, Play, Plus, Star } from "lucide-react";
import { Content } from "@/types/content";

export default function HeroBanner({ item }: { item: Content | null }) {
  if (!item) {
    return (
      <section className="glass flex h-[60vh] min-h-[400px] items-center justify-center rounded-none">
        <div className="text-center">
          <h1 className="font-[var(--font-heading)] text-5xl text-primary">WATCHMIRROR</h1>
          <p className="mt-2 text-muted">Stream Without Limits.</p>
        </div>
      </section>
    );
  }

  const detailsHref = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
  const watchHref = item.type === "movie" ? `/watch/${item.slug}` : `/series/watch/${item.slug}`;

  return (
    <section className="relative -mx-4 -mt-6 h-[85vh] min-h-[500px] w-[calc(100%+32px)] md:-mx-8 md:-mt-8 md:w-[calc(100%+64px)] lg:-mt-8">
      <Image
        src={item.banner || item.poster}
        alt={item.title}
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-center px-4 py-20 md:px-16 lg:px-24">
        <div className="max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {item.type === "movie" ? "Movie" : "Web Series"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Star size={12} className="text-yellow-400" /> {Number.isFinite(item.rating) ? item.rating.toFixed(1) : "N/A"}
            </span>
            <span className="rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {item.year} · {item.language}
            </span>
            {item.quality && (
              <span className="rounded border border-white/30 bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {item.quality}
              </span>
            )}
          </div>
          
          <h1 className="font-[var(--font-heading)] text-4xl text-white md:text-5xl lg:text-6xl">
            {item.title}
          </h1>
          
          <p className="mt-4 line-clamp-3 text-base text-gray-300 md:text-lg">
            {item.description}
          </p>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={watchHref}
              className="inline-flex items-center gap-2 rounded bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-white/90"
            >
              <Play size={20} fill="black" /> Play
            </Link>
            <Link
              href={detailsHref}
              className="inline-flex items-center gap-2 rounded bg-white/20 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <Info size={20} /> More Info
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
