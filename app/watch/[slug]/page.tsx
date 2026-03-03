import type { Metadata } from "next";
import ContentRow from "@/components/common/ContentRow";
import StreamingPlayer from "@/components/players/StreamingPlayer";
import { getContentBySlug, getSimilarContent } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug);
  return {
    title: content ? `Watch ${content.title}` : "Watch"
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
      />
      <ContentRow title="Related Movies" items={similar.filter((item) => item.type === "movie")} />
    </div>
  );
}