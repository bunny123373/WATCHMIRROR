import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
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

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border shadow-glass">
      <Image src={item.banner || item.poster} alt={item.title} width={1600} height={700} className="h-[340px] w-full object-cover opacity-60 md:h-[420px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
        <span className="mb-2 inline-flex w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold text-black">Featured</span>
        <h1 className="max-w-2xl font-[var(--font-heading)] text-3xl md:text-5xl">{item.title}</h1>
        <p className="mt-3 line-clamp-3 max-w-xl text-sm text-muted md:text-base">{item.description}</p>
        <Link href={detailsHref} className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-black">
          <Play size={16} /> Watch Now
        </Link>
      </div>
    </section>
  );
}