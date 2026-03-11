import Link from "next/link";
import Image from "next/image";
import { Content } from "@/types/content";

export default function TopTenRow({ items }: { items: Content[] }) {
  const top = items.slice(0, 10);
  if (!top.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-[var(--font-heading)] text-xl text-white md:text-2xl">Top 10 in India Today</h2>
      <div className="scrollbar-thin snap-x snap-mandatory flex gap-2 overflow-x-auto pb-4 scroll-smooth will-change-transform">
        {top.map((item, idx) => {
          const href = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
          const hasValidPoster =
            typeof item.poster === "string" &&
            (item.poster.startsWith("/") || item.poster.startsWith("https://image.tmdb.org/"));
          return (
            <Link key={`${item.type}-${item.slug}`} href={href} className="group relative flex w-[140px] shrink-0 snap-start items-end gap-1 sm:w-[160px] md:w-[180px] lg:w-[200px]">
              <span className="select-none text-5xl font-black leading-none text-white/20 transition group-hover:text-white md:text-7xl">{idx + 1}</span>
              <div className="relative w-[100px] overflow-hidden rounded-md border border-transparent bg-[#0a0a0a] transition duration-300 group-hover:scale-110 group-hover:border-white/30 group-hover:shadow-lg sm:w-[120px] md:w-[140px] lg:w-[160px]">
                {hasValidPoster ? (
                  <Image src={item.poster} alt={item.title} width={300} height={450} className="aspect-[2/3] w-full object-cover bg-[#1a1a1a]" />
                ) : (
                  <div className="aspect-[2/3] w-full bg-[#12151D]" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1.5">
                  <p className="line-clamp-1 text-[10px] font-semibold text-white sm:text-xs">{item.title}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
