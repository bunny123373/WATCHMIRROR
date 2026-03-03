import Link from "next/link";
import Image from "next/image";
import { Content } from "@/types/content";

export default function TopTenRow({ items }: { items: Content[] }) {
  const top = items.slice(0, 10);
  if (!top.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-[var(--font-heading)] text-2xl">Top 10 Today</h2>
      <div className="scrollbar-thin flex gap-4 overflow-x-auto py-2">
        {top.map((item, idx) => {
          const href = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
          const hasValidPoster =
            typeof item.poster === "string" &&
            (item.poster.startsWith("/") || item.poster.startsWith("https://image.tmdb.org/"));
          return (
            <Link key={`${item.type}-${item.slug}`} href={href} className="group relative flex w-[250px] shrink-0 items-end gap-2">
              <span className="select-none text-7xl font-black leading-none text-[#2f2f2f] transition group-hover:text-[#555]">{idx + 1}</span>
              <div className="relative w-[170px] overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#181818]">
                {hasValidPoster ? (
                  <Image src={item.poster} alt={item.title} width={300} height={450} className="aspect-[2/3] w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <div className="aspect-[2/3] w-full bg-[#12151D]" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-2">
                  <p className="line-clamp-1 text-xs font-semibold text-white">{item.title}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
