import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Play, Star, ChevronLeft } from "lucide-react";
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
    return <div className="rounded-2xl border border-border p-6">Movie not found.</div>;
  }

  const similar = await getSimilarContent(content);

  return (
    <div className="space-y-8 -mt-6">
      <section className="relative w-full">
        <StreamingPlayer
          type="movie"
          slug={content.slug}
          title={content.title}
          poster={content.poster}
          hlsLink={content.hlsLink}
          embedIframeLink={content.embedIframeLink}
          backupHlsLink={content.backupHlsLink}
          backupEmbedIframeLink={content.backupEmbedIframeLink}
          subtitleTracks={content.subtitleTracks}
        />
      </section>

      <section className="px-4 md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link href={`/movie/${content.slug}`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white">
              <ChevronLeft size={16} /> Back to details
            </Link>
          </div>
          
          <h1 className="font-[var(--font-heading)] text-2xl text-white md:text-3xl">{content.title}</h1>
          
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400 md:text-sm">
            <span className="flex items-center gap-1">
              <Star size={12} className="text-yellow-400" /> {Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}
            </span>
            <span>·</span>
            <span>{content.year}</span>
            <span>·</span>
            <span>{content.language}</span>
            {content.quality && <><span>·</span><span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{content.quality}</span></>}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/movie/${content.slug}`} className="inline-flex items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20">
              Details
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8">
        <ContentRow title="More Like This" items={similar.filter((item) => item.type === "movie")} />
      </section>
    </div>
  );
}
