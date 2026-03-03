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
    <Link href={href} className="group block w-[150px] shrink-0 sm:w-[180px]">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-glass">
        {hasValidPoster ? (
          <Image
            src={item.poster}
            alt={item.title}
            width={400}
            height={560}
            className="aspect-[2/3] w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="aspect-[2/3] w-full bg-[#12151D]" />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-black">{item.quality}</span>
      </div>
      <h3 className="mt-2 line-clamp-1 text-sm font-semibold text-text">{item.title}</h3>
      <p className="text-xs text-muted">
        {yearLabel} | {ratingLabel}
      </p>
    </Link>
  );
}
