import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import ContentRow from "@/components/common/ContentRow";
import StreamingPlayer from "@/components/players/StreamingPlayer";
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
    return <div className="p-4">Movie not found.</div>;
  }

  const similar = await getSimilarContent(content);

  return (
    <div className="min-h-screen bg-black">
      <Link 
        href={`/movie/${content.slug}`}
        className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:bg-black/90"
      >
        <ArrowLeft size={20} />
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

      <div className="px-4 py-4">
        <h1 className="font-[var(--font-heading)] text-xl text-white md:text-2xl">{content.title}</h1>
        
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Star size={10} className="text-yellow-400" /> {Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}
          </span>
          <span>·</span>
          <span>{content.year}</span>
          <span>·</span>
          <span>{content.language}</span>
        </div>
      </div>

      <div className="px-4 pb-8">
        <ContentRow title="More Like This" items={similar.filter((item) => item.type === "movie")} />
      </div>
    </div>
  );
}
