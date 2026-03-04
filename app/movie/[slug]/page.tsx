import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clapperboard, Play, Star } from "lucide-react";
import ContentRow from "@/components/common/ContentRow";
import { getContentBySlug, getSimilarContent } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content) {
    return { title: "Movie Not Found" };
  }

  return {
    title: content.metaTitle || content.title,
    description: content.metaDescription || content.description,
    alternates: {
      canonical: `/movie/${slug}`
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

export default async function MovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content || content.type !== "movie") {
    return <div className="rounded-2xl border border-border p-6">Movie not found.</div>;
  }

  const similar = await getSimilarContent(content);
  const topTags = (content.tags || []).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: content.title,
    description: content.description,
    image: content.poster,
    datePublished: `${content.year}-01-01`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: content.rating,
      bestRating: 10
    }
  };

  return (
    <div className="space-y-10">
      <section className="relative min-h-[68vh] overflow-hidden rounded-2xl bg-black">
        <Image
          src={content.banner || content.poster}
          alt={content.title}
          fill
          priority
          className="object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded bg-[#E50914] px-2.5 py-1 text-white">Movie</span>
              <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 text-[#e5e5e5]">
                <Star size={12} className="text-[#E50914]" />
                {Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}
              </span>
              <span className="rounded bg-white/10 px-2.5 py-1 text-[#e5e5e5]">{content.year || "N/A"}</span>
              <span className="rounded bg-white/10 px-2.5 py-1 text-[#e5e5e5]">{content.language || "N/A"}</span>
              {content.quality && <span className="rounded bg-white/10 px-2.5 py-1 text-[#e5e5e5]">{content.quality}</span>}
            </div>

            <h1 className="font-[var(--font-heading)] text-4xl font-bold leading-tight text-white md:text-6xl">
              {content.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-[#d1d5db] md:text-base">{content.description}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/watch/${content.slug}`} className="inline-flex items-center gap-2 rounded bg-white px-6 py-3 text-sm font-bold text-black hover:bg-[#e5e5e5]">
                <Play size={16} fill="currentColor" /> Play
              </Link>
              {content.trailerEmbedUrl && (
                <a href="#trailer" className="inline-flex items-center gap-2 rounded bg-[#6d6d6eb3] px-6 py-3 text-sm font-bold text-white hover:bg-[#808082b3]">
                  <Clapperboard size={16} /> Trailer
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Overview</h2>
            <p className="mt-2 text-sm leading-6 text-[#c7c7c7]">{content.description}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">Cast</h2>
            {content.cast.length > 0 ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {content.cast.slice(0, 8).map((actor) => (
                  <div key={`${actor.name}-${actor.character}`} className="flex items-center gap-3 rounded-lg bg-[#1a1a1a] p-3">
                    {actor.profileImage ? (
                      <Image src={actor.profileImage} alt={actor.name} width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-[#2b2b2b]" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{actor.name}</p>
                      <p className="text-xs text-[#a7a7a7]">{actor.character || "Cast"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[#9a9a9a]">Cast details are not available for this title.</p>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-xl bg-[#181818] p-4">
          <Image src={content.poster} alt={content.title} width={300} height={420} className="w-full rounded-lg object-cover" />
          <div className="mt-4 space-y-2 text-sm text-[#c7c7c7]">
            <p><span className="font-semibold text-white">Year:</span> {content.year || "N/A"}</p>
            <p><span className="font-semibold text-white">Language:</span> {content.language || "N/A"}</p>
            <p><span className="font-semibold text-white">Category:</span> {content.category || "Movie"}</p>
            <p><span className="font-semibold text-white">Rating:</span> {Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}</p>
          </div>
          {topTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {topTags.map((tag) => (
                <span key={tag} className="rounded-full bg-[#2b2b2b] px-2.5 py-1 text-xs text-[#e5e5e5]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </aside>
      </section>

      {content.trailerEmbedUrl && (
        <section id="trailer" className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Trailer</h2>
          <div className="overflow-hidden rounded-xl bg-black">
            <div className="relative aspect-video">
              <iframe src={content.trailerEmbedUrl} className="absolute inset-0 h-full w-full" allowFullScreen />
            </div>
          </div>
        </section>
      )}

      <ContentRow title="Similar Movies" items={similar.filter((item) => item.type === "movie")} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
