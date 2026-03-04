import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Star } from "lucide-react";
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
    <div className="-mx-4 -mt-6 min-h-screen w-[calc(100%+32px)] bg-black sm:-mx-8 sm:w-[calc(100%+64px)]">
      <div className="pb-6 pt-14 md:pt-4">
        <section className="w-full">
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

        <section className="px-4">
          <Link href={`/movie/${content.slug}`} className="mb-3 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
            <ChevronLeft size={16} /> Back
          </Link>
          
          <h1 className="font-[var(--font-heading)] text-xl text-white md:text-2xl">{content.title}</h1>
          
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Star size={10} className="text-yellow-400" /> {Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}
            </span>
            <span>·</span>
            <span>{content.year}</span>
            <span>·</span>
            <span>{content.language}</span>
            {content.quality && <><span>·</span><span className="rounded bg-red-600 px-1 py-0.5 text-[9px] font-bold text-white">{content.quality}</span></>}
          </div>
        </section>

        <section className="mt-6 px-4">
          <ContentRow title="More Like This" items={similar.filter((item) => item.type === "movie")} />
        </section>
      </div>
    </div>
  );
}
