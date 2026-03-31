import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Home, AlertCircle, Search, Film, Tv, TrendingUp, MoreVertical } from "lucide-react";
import ContentRow from "@/components/common/ContentRow";
import SeriesWatchClient from "@/components/series/SeriesWatchClient";
import WatchHistoryTracker from "@/components/common/WatchHistoryTracker";
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
          <AlertCircle className="mx-auto h-12 w-12 md:h-16 md:w-16 text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-white md:text-2xl">Series Not Found</h2>
          <p className="mt-2 text-sm text-gray-400 md:text-base">Cannot find series: {slug}</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 md:px-6 md:py-3 md:text-base">
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
      <WatchHistoryTracker slug={content.slug} />
      
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/10 bg-gradient-to-b from-black/95 via-black/80 to-transparent px-3 md:h-16 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          <Link 
            href={`/series/${content.slug}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 md:h-10 md:w-10"
            aria-label="Back to series details"
          >
            <ArrowLeft size={18} className="md:h-5 md:w-5" />
          </Link>
          
          <div className="hidden items-center gap-1 md:flex">
            <Link href="/" className="flex items-center gap-1 rounded px-2 py-1.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
              <Home size={16} />
              <span>Home</span>
            </Link>
            <Link href="/movies" className="flex items-center gap-1 rounded px-2 py-1.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
              <Film size={16} />
              <span>Movies</span>
            </Link>
            <Link href="/series" className="flex items-center gap-1 rounded px-2 py-1.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
              <Tv size={16} />
              <span>Series</span>
            </Link>
            <Link href="/trending" className="flex items-center gap-1 rounded px-2 py-1.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
              <TrendingUp size={16} />
              <span>Trending</span>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
          <Link href="/search" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 md:h-10 md:w-10">
            <Search size={18} />
          </Link>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 md:h-10 md:w-10"
            aria-label="More options"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </header>
      
      <div className="pt-14 md:pt-16">
        <SeriesWatchClient content={content} />

        <div className="px-3 py-4 md:px-4 md:py-6">
          <h1 className="font-[var(--font-heading)] text-lg font-bold text-white md:text-2xl lg:text-3xl">
            {content.title}
          </h1>
        </div>

        <div className="px-3 pb-8 md:px-4 md:pb-12">
          <ContentRow title="More Like This" items={similar.filter((item) => item.type === "series")} />
        </div>
      </div>
    </div>
  );
}
