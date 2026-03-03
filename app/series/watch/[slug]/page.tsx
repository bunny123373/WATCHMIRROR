import type { Metadata } from "next";
import Image from "next/image";
import ContentRow from "@/components/common/ContentRow";
import SeriesWatchClient from "@/components/series/SeriesWatchClient";
import { getContentBySlug, getSimilarContent } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug);
  const canonical = `/series/watch/${slug}`;
  return {
    title: content ? `Watch ${content.title}` : "Watch Series",
    description: content?.metaDescription || content?.description || "Watch series on WATCHMIRROR.",
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

export default async function SeriesWatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content || content.type !== "series") {
    return <div className="rounded-2xl border border-border p-6">Series not found.</div>;
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
          <span className="rounded bg-[#E50914] px-3 py-1 text-xs font-bold text-white">Series</span>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr,320px]">
          <SeriesWatchClient content={content} />
          <aside className="rounded-xl border border-[#2a2a2a] bg-[#181818] p-4">
            <Image src={content.poster} alt={content.title} width={280} height={400} className="w-full rounded-lg object-cover" />
            <p className="mt-3 text-sm text-[#d4d4d4]">{content.description}</p>
            <p className="mt-2 text-xs text-[#b3b3b3]">{(content.seasons || []).length} seasons available</p>
          </aside>
        </div>
      </section>

      <ContentRow title="More Like This" items={similar.filter((item) => item.type === "series")} />
    </div>
  );
}
