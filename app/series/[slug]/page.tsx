import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Play, Star } from "lucide-react";
import ContentRow from "@/components/common/ContentRow";
import { getContentBySlug, getSimilarContent } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content) return { title: "Series Not Found" };

  return {
    title: content.metaTitle || content.title,
    description: content.metaDescription || content.description,
    alternates: {
      canonical: `/series/${slug}`
    },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: content.title,
    description: content.description,
    image: content.poster,
    startDate: `${content.year}-01-01`,
    genre: content.tags
  };

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#111]">
        <Image src={content.banner || content.poster} alt={content.title} width={1600} height={700} className="h-[340px] w-full object-cover opacity-55 md:h-[440px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
        <div className="absolute inset-0 p-6 md:p-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded bg-[#E50914] px-3 py-1 text-xs font-bold text-white">Series</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#3a3a3a] bg-black/40 px-3 py-1 text-xs text-[#d4d4d4]">
              <Star size={12} className="text-[#E50914]" /> {Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}
            </span>
          </div>
          <h1 className="font-[var(--font-heading)] text-3xl md:text-5xl">{content.title}</h1>
          <p className="mt-2 text-sm text-[#d4d4d4]">{content.year} | {content.language}</p>
          <p className="mt-4 max-w-2xl text-sm text-[#d4d4d4] md:text-base">{content.description}</p>
          <Link href={`/series/watch/${content.slug}`} className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-bold text-black">
            <Play size={16} /> Watch Series
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#2a2a2a] bg-[#181818] p-4">
          <h2 className="mb-3 font-[var(--font-heading)] text-xl">Seasons</h2>
          <div className="space-y-2 text-sm text-[#d4d4d4]">
            {(content.seasons || []).map((season) => (
              <p key={season.seasonNumber}>
                Season {season.seasonNumber} ({season.episodes.length} episodes)
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#2a2a2a] bg-[#181818] p-4">
          <h2 className="mb-3 font-[var(--font-heading)] text-xl">Cast</h2>
          <div className="space-y-2">
            {content.cast.map((actor) => (
              <div key={`${actor.name}-${actor.character}`} className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                {actor.profileImage ? (
                  <Image src={actor.profileImage} alt={actor.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-black/30" />
                )}
                <p>
                  {actor.name} as {actor.character}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {content.trailerEmbedUrl && (
        <section className="space-y-3">
          <h2 className="font-[var(--font-heading)] text-2xl">Trailer</h2>
          <div className="overflow-hidden rounded-xl border border-[#2a2a2a]">
            <div className="relative aspect-video">
              <iframe src={content.trailerEmbedUrl} className="absolute inset-0 h-full w-full" allowFullScreen />
            </div>
          </div>
        </section>
      )}

      <ContentRow title="Similar Series" items={similar.filter((item) => item.type === "series")} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
