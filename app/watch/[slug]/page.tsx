import type { Metadata } from "next";
import Image from "next/image";
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

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[#2a2a2a] bg-[#111] p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-[var(--font-heading)] text-3xl">{content.title}</h1>
            <p className="text-sm text-[#b3b3b3]">
              {content.year} | {content.language} | {Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}
            </p>
          </div>
          <span className="rounded bg-[#E50914] px-3 py-1 text-xs font-bold text-white">Movie</span>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr,320px]">
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
          <aside className="rounded-xl border border-[#2a2a2a] bg-[#181818] p-4">
            <Image src={content.poster} alt={content.title} width={280} height={400} className="w-full rounded-lg object-cover" />
            <p className="mt-3 text-sm text-[#d4d4d4]">{content.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(content.tags || []).slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full border border-[#3a3a3a] px-2 py-1 text-[11px] text-[#d4d4d4]">
                  {tag}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <ContentRow title="More Like This" items={similar.filter((item) => item.type === "movie")} />
    </div>
  );
}
