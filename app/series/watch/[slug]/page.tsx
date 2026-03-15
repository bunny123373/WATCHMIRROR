import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Home, AlertCircle } from "lucide-react";
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold text-white">Series Not Found</h2>
          <p className="mt-2 text-gray-400">Cannot find series: {slug}</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700">
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
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
