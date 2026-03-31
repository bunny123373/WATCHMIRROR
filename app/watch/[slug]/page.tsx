import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Star, Share2, MoreVertical } from "lucide-react";
import ContentRow from "@/components/common/ContentRow";
import StreamingPlayer from "@/components/players/StreamingPlayer";
import WatchHistoryTracker from "@/components/common/WatchHistoryTracker";
import { getContentBySlug, getSimilarContent } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug);
  return {
    title: content ? `Watch ${content.title}` : "Watch",
    description: content?.description || "Watch now on WATCHMIRROR.",
    alternates: { canonical: `/watch/${slug}` }
  };
}

export default async function WatchMoviePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content || content.type !== "movie") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Movie Not Found</h2>
          <p className="mt-2 text-gray-400">Cannot find movie: {slug}</p>
          <Link href="/" className="mt-6 inline-block rounded-xl bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const similar = await getSimilarContent(content);

  return (
    <div className="min-h-screen bg-black">
      <WatchHistoryTracker slug={content.slug} />
      
      <div className="relative">
        <Link 
          href={`/movie/${content.slug}`}
          className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:bg-black/90 md:left-4 md:top-4 md:h-12 md:w-12"
          aria-label="Back to movie details"
        >
          <ArrowLeft size={20} className="md:h-6 md:w-6" />
        </Link>

        <StreamingPlayer
          type="movie"
          slug={content.slug}
          title={content.title}
          poster={content.poster}
          tmdbId={content.tmdbId}
          imdbId={content.imdbId}
          hlsLink={content.hlsLink}
          embedIframeLink={content.embedIframeLink}
          backupHlsLink={content.backupHlsLink}
          backupEmbedIframeLink={content.backupEmbedIframeLink}
          subtitleTracks={content.subtitleTracks}
          videoSources={content.videoSources}
          introEnd={content.introEnd}
          outroStart={content.outroStart}
        />
      </div>

      <div className="px-3 py-4 md:px-4 md:py-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-[var(--font-heading)] text-lg font-bold text-white md:text-2xl lg:text-3xl">
              {content.title}
            </h1>
            
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400 md:text-sm">
              <span className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400 md:size-14" /> 
                {Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}
              </span>
              <span className="hidden sm:inline">·</span>
              <span>{content.year}</span>
              <span>·</span>
              <span>{content.quality}</span>
              <span>·</span>
              <span className="capitalize">{content.language}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label="Share"
            >
              <Share2 size={18} />
            </button>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label="More options"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {content.description && (
          <p className="mt-2 text-sm leading-relaxed text-gray-300 md:text-base">
            {content.description}
          </p>
        )}

        {content.cast && content.cast.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 md:text-sm">
              Cast: {content.cast.slice(0, 5).map(c => c.name).join(", ")}
            </p>
          </div>
        )}
      </div>

      <div className="px-3 pb-8 md:px-4 md:pb-12">
        <ContentRow title="More Like This" items={similar.filter((item) => item.type === "movie")} />
      </div>
    </div>
  );
}
