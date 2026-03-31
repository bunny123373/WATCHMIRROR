import Link from "next/link";
import Image from "next/image";
import { Info, Play, Star } from "lucide-react";
import { Content } from "@/types/content";

export default function HeroBanner({ item }: { item: Content | null }) {
  if (!item) {
    return (
      <section className="flex h-[50vh] min-h-[300px] items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <h1 className="font-[var(--font-heading)] text-4xl font-bold tracking-wider md:text-5xl">
            <span className="text-[#E50914]">WATCH</span>
            <span className="text-white">MIRROR</span>
          </h1>
          <p className="mt-2 text-muted">Stream Without Limits.</p>
        </div>
      </section>
    );
  }

  const detailsHref = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
  const watchHref = item.type === "movie" ? `/watch/${item.slug}` : `/series/watch/${item.slug}`;

  return (
    <section className="relative h-[56.25vw] min-h-[280px] max-h-[80vh] w-full overflow-hidden">
      <Image
        src={item.banner || item.poster}
        alt={item.title}
        fill
        priority
        className="object-cover bg-[#0a0a0a]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/90 via-transparent to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-20 md:px-8 md:pb-12 lg:px-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 flex flex-wrap items-center gap-2 md:mb-3">
            <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium uppercase text-white backdrop-blur-sm md:text-xs">
              {item.type === "movie" ? "Movie" : "Series"}
            </span>
            <span className="flex items-center gap-1 rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm md:text-xs">
              <Star size={10} className="text-yellow-400 md:size-3" /> {Number.isFinite(item.rating) ? item.rating.toFixed(1) : "N/A"}
            </span>
            <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm md:text-xs">
              {item.year} | {item.language}
            </span>
            {item.quality && (
              <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white md:text-[10px]">
                {item.quality}
              </span>
            )}
          </div>
          
          <h1 className="font-[var(--font-heading)] text-2xl leading-tight text-white md:text-3xl lg:text-4xl">
            {item.title}
          </h1>
          
          <p className="mt-2 line-clamp-2 text-xs text-gray-300 md:mt-3 md:text-sm lg:text-base">
            {item.description}
          </p>
          
          <div className="mt-4 flex flex-wrap gap-2 md:mt-5 md:gap-3">
            <Link
              href={watchHref}
              className="inline-flex items-center gap-1.5 rounded bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-white/90 md:px-6 md:py-3 md:text-base"
            >
              <Play size={16} fill="black" className="md:size-5" /> Play
            </Link>
            <Link
              href={detailsHref}
              className="inline-flex items-center gap-1.5 rounded bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/30 md:px-6 md:py-3 md:text-base"
            >
              <Info size={16} className="md:size-5" /> More Info
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
