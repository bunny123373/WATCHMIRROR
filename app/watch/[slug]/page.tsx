import type { Metadata } from "next";
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
      <h1 className="font-[var(--font-heading)] text-3xl">{content.title}</h1>
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
      <ContentRow title="Related Movies" items={similar.filter((item) => item.type === "movie")} />
    </div>
  );
}
