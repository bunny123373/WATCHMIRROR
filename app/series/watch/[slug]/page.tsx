import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ContentRow from "@/components/common/ContentRow";
import SeriesWatchClient from "@/components/series/SeriesWatchClient";
import { getContentBySlug, getSimilarContent } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug);
  return {
    title: content ? `Watch ${content.title}` : "Watch Series",
    description: content?.description || "Watch series on WATCHMIRROR.",
    alternates: { canonical: `/series/watch/${slug}` }
  };
}

export default async function SeriesWatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content || content.type !== "series") {
    return <div className="p-4">Series not found.</div>;
  }

  const similar = await getSimilarContent(content);

  return (
    <div className="min-h-screen bg-black">
      <Link 
        href={`/series/${content.slug}`}
        className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:bg-black/90"
      >
        <ArrowLeft size={20} />
      </Link>

      <SeriesWatchClient content={content} />

      <div className="px-4 py-4">
        <h1 className="font-[var(--font-heading)] text-xl text-white md:text-2xl">{content.title}</h1>
      </div>

      <div className="px-4 pb-8">
        <ContentRow title="More Like This" items={similar.filter((item) => item.type === "series")} />
      </div>
    </div>
  );
}
