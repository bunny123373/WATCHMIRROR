import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Play, Star, Clapperboard } from "lucide-react";
import ContentRow from "@/components/common/ContentRow";
import TrailerHandler from "@/components/common/TrailerHandler";
import { getContentBySlug, getSimilarContent } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content) return { title: "Series Not Found" };

  return {
    title: content.metaTitle || content.title,
    description: content.metaDescription || content.description,
    alternates: { canonical: `/series/${slug}` },
    openGraph: {
      title: content.metaTitle || content.title,
      description: content.metaDescription || content.description,
      images: content.banner ? [content.banner] : undefined,
      siteName: "WATCHMIRROR"
    },
    twitter: {
      card: "summary_large_image",
      title: content.metaTitle || content.title,
      description: content.metaDescription || content.description,
      images: content.banner ? [content.banner] : undefined
    }
  };
}

export default async function SeriesDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content || content.type !== "series") {
    return <div className="rounded-2xl border border-border p-6">Series not found.</div>;
  }

  const similar = await getSimilarContent(content);
  const topTags = (content.tags || []).slice(0, 4);
  const seasonsCount = (content.seasons || []).length;

  return (
    <div className="space-y-8">
      <TrailerHandler />
      <section className="relative -mx-4 -mt-6 h-[56.25vw] min-h-[280px] max-h-[80vh] w-[calc(100%+32px)] overflow-hidden sm:-mx-8 sm:w-[calc(100%+64px)] md:-mt-8">
        <Image src={content.banner || content.poster} alt={content.title} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-24 md:px-8 md:pb-12 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex flex-wrap items-center gap-2 md:mb-3">
              <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium uppercase text-white backdrop-blur-sm md:text-xs">Series</span>
              <span className="flex items-center gap-1 rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm md:text-xs">
                <Star size={10} className="text-yellow-400 md:size-3" /> {Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}
              </span>
              <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm md:text-xs">{content.year} · {content.language}</span>
              {content.quality && <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white md:text-[10px]">{content.quality}</span>}
            </div>

            <h1 className="font-[var(--font-heading)] text-2xl leading-tight text-white md:text-3xl lg:text-4xl">{content.title}</h1>
            <p className="mt-2 line-clamp-2 text-xs text-gray-300 md:mt-3 md:text-sm lg:text-base">{content.description}</p>

            <div className="mt-4 flex flex-wrap gap-2 md:mt-5 md:gap-3">
              <Link href={`/series/watch/${content.slug}`} className="inline-flex items-center gap-1.5 rounded bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-white/90 md:px-6 md:py-3 md:text-base">
                <Play size={16} fill="black" className="md:size-5" /> Play
              </Link>
              {content.trailerEmbedUrl && (
                <Link href="#trailer" scroll={false} onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("openTrailer", { detail: content.trailerEmbedUrl })); }} className="inline-flex items-center gap-1.5 rounded bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/30 md:px-4 md:py-3">
                  <Clapperboard size={16} /> Trailer
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Overview</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">{content.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {topTags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">{tag}</span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><p className="text-gray-500">Year</p><p className="font-medium text-white">{content.year}</p></div>
            <div><p className="text-gray-500">Language</p><p className="font-medium text-white">{content.language}</p></div>
            <div><p className="text-gray-500">Rating</p><p className="font-medium text-white">{Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}</p></div>
            <div><p className="text-gray-500">Seasons</p><p className="font-medium text-white">{seasonsCount}</p></div>
          </div>

          {seasonsCount > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">Seasons</h3>
              <div className="flex flex-wrap gap-2">
                {(content.seasons || []).slice(0, 10).map((season) => (
                  <Link key={season.seasonNumber} href={`/series/watch/${content.slug}?season=${season.seasonNumber}`} className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20">
                    Season {season.seasonNumber} ({season.episodes.length} eps)
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 md:px-8">
        <ContentRow title="More Like This" items={similar.filter((item) => item.type === "series")} />
      </section>
    </div>
  );
}
