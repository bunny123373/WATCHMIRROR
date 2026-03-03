import Link from "next/link";
import Image from "next/image";
import { Content } from "@/types/content";

export default function ContentCard({ item }: { item: Content }) {
  const href = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
  const hasValidPoster =
    typeof item.poster === "string" &&
    (item.poster.startsWith("/") || item.poster.startsWith("https://image.tmdb.org/"));
  const yearLabel = Number.isFinite(item.year) ? String(item.year) : "N/A";
  const ratingLabel = Number.isFinite(item.rating) ? item.rating.toFixed(1) : "N/A";

  return (
    <Link href={href} className="group block w-[170px] shrink-0 transition sm:w-[210px] md:w-[230px]">
      <div className="relative overflow-hidden rounded-xl border border-[#202020] bg-[#141414] transition duration-300 group-hover:z-20 group-hover:scale-[1.08] group-hover:border-[#343434] group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.55)]">
        {hasValidPoster ? (
          <Image
            src={item.poster}
            alt={item.title}
            width={400}
            height={560}
            className="aspect-[2/3] w-full object-cover transition duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="aspect-[2/3] w-full bg-[#12151D]" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-white">{item.title}</h3>
          <p className="mt-1 text-[11px] text-[#D1D5DB]">
            {yearLabel} • {ratingLabel} • {item.type === "movie" ? "Movie" : "Series"}
          </p>
        </div>
        <span className="absolute left-2 top-2 rounded bg-[#E50914] px-2 py-1 text-[10px] font-bold text-white">{item.quality}</span>
      </div>
    </Link>
  );
}
