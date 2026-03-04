import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Play, Star } from "lucide-react";
import ContentRow from "@/components/common/ContentRow";
import StreamingPlayer from "@/components/players/StreamingPlayer";
import { getContentBySlug, getSimilarContent } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug);
  const canonical = `/watch/${slug}`;
  return {
    title: content ? `Watch ${content.title}` : "Watch",
    description: content?.metaDescription || content?.description || "Watch now on WATCHMIRROR.",
    alternates: { canonical },
    openGraph: content
      ? {
          title: `Watch ${content.title}`,
          description: content.metaDescription || content.description,
          images: content.banner ? [content.banner] : undefined
        }
      : undefined
  };
}

export default async function WatchMoviePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content || content.type !== "movie") {
    return <div className="rounded-2xl border border-border p-6">Movie not found.</div>;
  }

  const similar = await getSimilarContent(content);
  const topTags = (content.tags || []).slice(0, 4);

  return (
    <div className="space-y-10">
      <section className="relative min-h-[56vh] overflow-hidden rounded-2xl bg-black">
        <Image src={content.banner || content.poster} alt={content.title} fill priority className="object-cover opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
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
            <h1 className="font-[var(--font-heading)] text-4xl font-bold leading-tight text-white md:text-6xl">{content.title}</h1>
            <p className="mt-4 max-w-2xl text-sm text-[#d1d5db] md:text-base">{content.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/movie/${content.slug}`} className="inline-flex items-center gap-2 rounded bg-[#6d6d6eb3] px-6 py-3 text-sm font-bold text-white hover:bg-[#808082b3]">
                Details
              </Link>
              <span className="inline-flex items-center gap-2 rounded bg-white px-6 py-3 text-sm font-bold text-black">
                <Play size={16} fill="currentColor" /> Now Playing
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-4">
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
        </div>

        <aside className="h-fit rounded-xl bg-[#181818] p-4 lg:sticky lg:top-24">
          <Image src={content.poster} alt={content.title} width={280} height={400} className="w-full rounded-lg object-cover" />
          <div className="mt-4 space-y-2 text-sm text-[#c7c7c7]">
            <p><span className="font-semibold text-white">Year:</span> {content.year || "N/A"}</p>
            <p><span className="font-semibold text-white">Language:</span> {content.language || "N/A"}</p>
            {content.quality && <p><span className="font-semibold text-white">Quality:</span> {content.quality}</p>}
          </div>
          {topTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {topTags.map((tag) => (
                <span key={tag} className="rounded-full bg-[#2b2b2b] px-2.5 py-1 text-xs text-[#e5e5e5]">{tag}</span>
              ))}
            </div>
          )}
        </aside>
      </section>

      <ContentRow title="More Like This" items={similar.filter((item) => item.type === "movie")} />
    </div>
  );
}
