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
  const topTags = (content.tags || []).slice(0, 4);

  return (
    <div className="space-y-8">
      <section className="relative -mx-4 -mt-6 h-[56.25vw] min-h-[280px] max-h-[80vh] w-[calc(100%+32px)] overflow-hidden sm:-mx-8 sm:w-[calc(100%+64px)] md:-mt-8">
        <Image src={content.banner || content.poster} alt={content.title} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-24 md:px-8 md:pb-12 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex flex-wrap items-center gap-2 md:mb-3">
              <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium uppercase text-white backdrop-blur-sm md:text-xs">Movie</span>
              <span className="flex items-center gap-1 rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm md:text-xs">
                <Star size={10} className="text-yellow-400 md:size-3" /> {Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}
              </span>
              <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm md:text-xs">{content.year} · {content.language}</span>
              {content.quality && <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white md:text-[10px]">{content.quality}</span>}
            </div>

            <h1 className="font-[var(--font-heading)] text-2xl leading-tight text-white md:text-3xl lg:text-4xl">{content.title}</h1>
            <p className="mt-2 line-clamp-2 text-xs text-gray-300 md:mt-3 md:text-sm lg:text-base">{content.description}</p>

            <div className="mt-16 flex flex-col gap-2 md:mt-10 md:flex-row md:justify-center md:gap-3">
              <Link href={`/watch/${content.slug}`} className="flex w-full items-center justify-center gap-2 rounded bg-white px-8 py-3 text-base font-bold text-black transition hover:bg-white/90 md:min-w-[160px] md:w-auto">
                <Play size={22} fill="black" /> Play
              </Link>
              {content.downloadLink && (
                <a href={content.downloadLink} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded border border-white/20 bg-white/10 px-8 py-3 text-base font-medium text-white transition hover:bg-white/20 md:min-w-[160px] md:w-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Download
                </a>
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

          {(content.audioLanguages && content.audioLanguages.length > 0) && (
            <div>
              <p className="text-sm font-medium text-white">Audio Languages</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {content.audioLanguages.map((lang: string) => {
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

          <div className="flex flex-wrap gap-2">
            {topTags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">{tag}</span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><p className="text-gray-500">Year</p><p className="font-medium text-white">{content.year}</p></div>
            <div><p className="text-gray-500">Language</p><p className="font-medium text-white">{content.language}</p></div>
            <div><p className="text-gray-500">Rating</p><p className="font-medium text-white">{Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}</p></div>
            <div><p className="text-gray-500">Category</p><p className="font-medium text-white">{content.category || "Movie"}</p></div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8">
        <ContentRow title="More Like This" items={similar.filter((item) => item.type === "movie")} />
      </section>
    </div>
  );
}
