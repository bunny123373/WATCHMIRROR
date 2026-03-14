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
    alternates: { canonical: `/movie/${slug}` },
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
    return <div className="p-4">Movie not found.</div>;
  }

  const similar = await getSimilarContent(content);
  const topTags = (content.tags || []).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#141414]">
      <section className="relative w-full" style={{ aspectRatio: '16/9', maxHeight: '80vh' }}>
        <Image 
          src={content.banner || content.poster} 
          alt={content.title} 
          fill 
          priority 
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-medium uppercase text-white backdrop-blur-sm">Movie</span>
            <span className="flex items-center gap-1 rounded bg-black/40 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              <Star size={12} className="text-yellow-400" /> {Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}
            </span>
            <span className="rounded bg-black/40 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">{content.year} · {content.language}</span>
            {content.quality && <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{content.quality}</span>}
          </div>

          <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">{content.title}</h1>
        </div>
      </section>

      <section className="px-4 py-6 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row">
          <Link href={`/watch/${content.slug}`} className="flex items-center justify-center gap-2 rounded bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-white/90 md:px-8">
            <Play size={20} fill="black" /> Play
          </Link>
          {content.downloadLink && (
            <a href={content.downloadLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded border border-white/20 bg-white/10 px-6 py-3 text-base font-medium text-white transition hover:bg-white/20 md:px-8">
              Download
            </a>
          )}
        </div>

        <p className="mt-6 text-sm text-gray-300 md:text-base">{content.description}</p>

        {topTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {topTags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">{tag}</span>
            ))}
          </div>
        )}
      </section>

      <section className="px-4 pb-8 md:px-8">
        <ContentRow title="More Like This" items={similar.filter((item) => item.type === "movie")} />
      </section>
    </div>
  );
}
