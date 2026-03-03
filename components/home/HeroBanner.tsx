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
    <section className="relative overflow-hidden rounded-2xl border border-border shadow-glass">
      <Image src={item.banner || item.poster} alt={item.title} width={1600} height={700} className="h-[360px] w-full object-cover opacity-60 md:h-[460px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
      <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold text-black">Featured</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-black/40 px-3 py-1 text-xs text-muted">
            <Star size={12} className="text-primary" /> {Number.isFinite(item.rating) ? item.rating.toFixed(1) : "N/A"}
          </span>
          <span className="rounded-full border border-border bg-black/40 px-3 py-1 text-xs text-muted">
            {item.year} | {item.language}
          </span>
        </div>
        <h1 className="max-w-2xl font-[var(--font-heading)] text-3xl md:text-5xl">{item.title}</h1>
        <p className="mt-3 line-clamp-3 max-w-xl text-sm text-muted md:text-base">{item.description}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={watchHref} className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-black">
            <Play size={16} /> Watch Now
          </Link>
          <Link href={detailsHref} className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-black/50 px-5 py-3 text-sm font-semibold">
            <Info size={16} /> More Info
          </Link>
        </div>
      </div>
    </section>
  );
}
