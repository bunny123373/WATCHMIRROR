import Link from "next/link";
import Image from "next/image";
import { Info, Play, Star } from "lucide-react";
import { Content } from "@/types/content";

export default function HeroBanner({ item }: { item: Content | null }) {
  if (!item) {
    return (
      <section className="glass rounded-2xl p-8">
        <h1 className="font-[var(--font-heading)] text-3xl text-primary">WATCHMIRROR</h1>
        <p className="mt-2 text-muted">Stream Without Limits.</p>
      </section>
    );
  }

  const detailsHref = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
  const watchHref = item.type === "movie" ? `/watch/${item.slug}` : `/series/watch/${item.slug}`;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#111]">
      <Image src={item.banner || item.poster} alt={item.title} width={1600} height={700} className="h-[420px] w-full object-cover opacity-75 md:h-[560px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex w-fit rounded-full bg-[#e50914] px-3 py-1 text-xs font-bold text-white">N Series</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#3a3a3a] bg-black/50 px-3 py-1 text-xs text-[#d4d4d4]">
            <Star size={12} className="text-[#e50914]" /> {Number.isFinite(item.rating) ? item.rating.toFixed(1) : "N/A"}
          </span>
          <span className="rounded-full border border-[#3a3a3a] bg-black/50 px-3 py-1 text-xs text-[#d4d4d4]">
            {item.year} | {item.language}
          </span>
        </div>
        <h1 className="max-w-3xl font-[var(--font-heading)] text-4xl md:text-6xl">{item.title}</h1>
        <p className="mt-3 line-clamp-3 max-w-2xl text-sm text-[#d4d4d4] md:text-base">{item.description}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={watchHref} className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-bold text-black">
            <Play size={16} /> Watch Now
          </Link>
          <Link href={detailsHref} className="inline-flex w-fit items-center gap-2 rounded-md bg-[#4b4b4b]/80 px-6 py-3 text-sm font-semibold text-white">
            <Info size={16} /> More Info
          </Link>
        </div>
      </div>
    </section>
  );
}
