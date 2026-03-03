import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Play, Star } from "lucide-react";
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
      <section className="relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#111]">
        <Image src={content.banner || content.poster} alt={content.title} width={1600} height={700} className="h-[340px] w-full object-cover opacity-55 md:h-[440px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
        <div className="absolute inset-0 grid gap-6 p-6 md:grid-cols-[240px,1fr] md:items-end md:p-10">
          <Image src={content.poster} alt={content.title} width={240} height={340} className="hidden rounded-xl border border-[#2a2a2a] md:block" />
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#E50914] px-3 py-1 text-xs font-bold text-white">Movie</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#3a3a3a] bg-black/40 px-3 py-1 text-xs text-[#d4d4d4]">
                <Star size={12} className="text-[#E50914]" /> {Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}
              </span>
              <span className="rounded-full border border-[#3a3a3a] bg-black/40 px-3 py-1 text-xs text-[#d4d4d4]">{content.quality}</span>
            </div>
            <h1 className="font-[var(--font-heading)] text-3xl md:text-5xl">{content.title}</h1>
            <p className="mt-2 text-sm text-[#d4d4d4]">{content.year} | {content.language}</p>
            <p className="mt-4 max-w-2xl text-sm text-[#d4d4d4] md:text-base">{content.description}</p>
            <Link href={`/watch/${content.slug}`} className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-bold text-black">
              <Play size={16} /> Watch Now
            </Link>
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

      <section className="space-y-4">
        <h2 className="font-[var(--font-heading)] text-2xl">Cast</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {content.cast.map((actor) => (
            <div key={`${actor.name}-${actor.character}`} className="flex items-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#181818] p-3">
              {actor.profileImage ? (
                <Image src={actor.profileImage} alt={actor.name} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-black/30" />
              )}
              <div>
                <p className="text-sm font-semibold">{actor.name}</p>
                <p className="text-xs text-muted">{actor.character}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ContentRow title="Similar Movies" items={similar.filter((item) => item.type === "movie")} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
