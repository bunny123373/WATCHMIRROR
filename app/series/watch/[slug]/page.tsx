import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
    <div className="-mx-4 -mt-6 min-h-screen w-[calc(100%+32px)] bg-black sm:-mx-8 sm:w-[calc(100%+64px)]">
      <div className="pb-6">
        <section className="w-full">
          <SeriesWatchClient content={content} />
        </section>

        <section className="px-4">
          <Link href={`/series/${content.slug}`} className="mb-3 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
            <ChevronLeft size={16} /> Back
          </Link>
          
          <h1 className="font-[var(--font-heading)] text-xl text-white md:text-2xl">{content.title}</h1>
        </section>

        <section className="mt-6 px-4">
          <ContentRow title="More Like This" items={similar.filter((item) => item.type === "series")} />
        </section>
      </div>
    </div>
  );
}
