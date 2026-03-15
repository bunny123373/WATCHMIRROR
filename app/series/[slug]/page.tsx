import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Play, Star, Home, AlertCircle } from "lucide-react";
import ContentRow from "@/components/common/ContentRow";
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414] px-4">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold text-white">Series Not Found</h2>
          <p className="mt-2 text-gray-400">The series &quot;{slug}&quot; does not exist or has been removed.</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700">
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const similar = await getSimilarContent(content);
  const topTags = (content.tags || []).slice(0, 4);
  const seasonsCount = (content.seasons || []).length;

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
            <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-medium uppercase text-white backdrop-blur-sm">Series</span>
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
        <Link href={`/series/watch/${content.slug}`} className="inline-flex items-center justify-center gap-2 rounded bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-white/90 md:px-8">
          <Play size={20} fill="black" /> Play
        </Link>
      </section>

      <section className="px-4 md:px-8">
        <h2 className="text-lg font-semibold text-white">Overview</h2>
        <p className="mt-2 text-sm text-gray-400">{content.description}</p>

        {content.audioLanguages && content.audioLanguages.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-white">Audio Languages</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {content.audioLanguages.map((lang) => {
                const langNames: Record<string, string> = {
                  EN: "English", TE: "Telugu", HI: "Hindi", TA: "Tamil", ML: "Malayalam",
                  KN: "Kannada", KO: "Korean", JA: "Japanese", ES: "Spanish", TH: "Thai", ZH: "Chinese"
                };
                return (
                  <span key={lang} className="rounded-full bg-red-600/20 px-3 py-1 text-xs text-red-400 border border-red-600/30">
                    {langNames[lang] || lang}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {topTags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">{tag}</span>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div><p className="text-gray-500">Year</p><p className="font-medium text-white">{content.year}</p></div>
          <div><p className="text-gray-500">Language</p><p className="font-medium text-white">{content.language}</p></div>
          <div><p className="text-gray-500">Rating</p><p className="font-medium text-white">{Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}</p></div>
          <div><p className="text-gray-500">Seasons</p><p className="font-medium text-white">{seasonsCount}</p></div>
        </div>

        {seasonsCount > 0 && (
          <div className="mt-6">
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
      </section>

      <section className="px-4 pb-8 md:px-8">
        <ContentRow title="More Like This" items={similar.filter((item) => item.type === "series")} />
      </section>
    </div>
  );
}
