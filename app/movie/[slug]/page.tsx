import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Play, Star, Plus, Check, Clapperboard } from "lucide-react";
import ContentRow from "@/components/common/ContentRow";
import TrailerModal from "@/components/common/TrailerModal";
import TrailerHandler from "@/components/common/TrailerHandler";
import { getContentBySlug, getSimilarContent } from "@/lib/content";
import { cookies } from "next/headers";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content) {
    return { title: "Movie Not Found" };
  }

  return {
    title: content.metaTitle || content.title,
    description: content.metaDescription || content.description,
    alternates: {
      canonical: `/movie/${slug}`
    },
    openGraph: {
      title: content.metaTitle || content.title,
      description: content.metaDescription || content.description,
      images: content.banner ? [content.banner] : undefined,
      siteName: "WATCHMIRROR"
    },
    twitter: {
      card: "summary_large_image",
      title: content.metaTitle || content.title,
      description: content.metaDescription || content.description,
      images: content.banner ? [content.banner] : undefined
    }
  };
}

export default async function MovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content || content.type !== "movie") {
    return <div className="rounded-2xl border border-border p-6">Movie not found.</div>;
  }

  const cookieStore = await cookies();
  const myListData = cookieStore.get("myList")?.value || "[]";
  const myList = JSON.parse(myListData);
  const isInList = myList.some((item: any) => item.slug === content.slug && item.type === content.type);

  const similar = await getSimilarContent(content);
  const topTags = (content.tags || []).slice(0, 4);

  return (
    <div className="space-y-8">
      <TrailerHandler />
      <section className="relative -mx-4 -mt-6 h-[56.25vw] min-h-[280px] max-h-[80vh] w-[calc(100%+32px)] overflow-hidden sm:-mx-8 sm:w-[calc(100%+64px)] md:-mt-8">
        <Image src={content.banner || content.poster} alt={content.title} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-24 md:px-8 md:pb-12 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex flex-wrap items-center gap-2 md:mb-3">
              <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium uppercase text-white backdrop-blur-sm md:text-xs">Movie</span>
              <span className="flex items-center gap-1 rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm md:text-xs">
                <Star size={10} className="text-yellow-400 md:size-3" /> {Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}
              </span>
              <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm md:text-xs">{content.year} · {content.language}</span>
              {content.quality && <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white md:text-[10px]">{content.quality}</span>}
            </div>

            <h1 className="font-[var(--font-heading)] text-2xl leading-tight text-white md:text-3xl lg:text-4xl">{content.title}</h1>
            <p className="mt-2 line-clamp-2 text-xs text-gray-300 md:mt-3 md:text-sm lg:text-base">{content.description}</p>

            <div className="mt-4 flex flex-wrap gap-2 md:mt-5 md:gap-3">
              <Link href={`/watch/${content.slug}`} className="inline-flex items-center gap-1.5 rounded bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-white/90 md:px-6 md:py-3 md:text-base">
                <Play size={16} fill="black" className="md:size-5" /> Play
              </Link>
              {content.trailerEmbedUrl && (
                <TrailerButton url={content.trailerEmbedUrl} />
              )}
              <Link href={`/add?slug=${content.slug}&type=movie&title=${encodeURIComponent(content.title)}&poster=${encodeURIComponent(content.poster)}&year=${content.year}&rating=${content.rating}&quality=${content.quality}`} className="inline-flex items-center gap-1.5 rounded bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/30 md:px-4 md:py-3">
                {isInList ? <Check size={16} /> : <Plus size={16} />}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Overview</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">{content.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {topTags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">{tag}</span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-gray-500">Year</p>
              <p className="font-medium text-white">{content.year}</p>
            </div>
            <div>
              <p className="text-gray-500">Language</p>
              <p className="font-medium text-white">{content.language}</p>
            </div>
            <div>
              <p className="text-gray-500">Rating</p>
              <p className="font-medium text-white">{Number.isFinite(content.rating) ? content.rating.toFixed(1) : "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500">Category</p>
              <p className="font-medium text-white">{content.category || "Movie"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8">
        <ContentRow title="More Like This" items={similar.filter((item) => item.type === "movie")} />
      </section>
    </div>
  );
}

function TrailerButton({ url }: { url: string }) {
  return (
    <Link href={`#trailer`} scroll={false} onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("openTrailer", { detail: url })); }} className="inline-flex items-center gap-1.5 rounded bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/30 md:px-4 md:py-3">
      <Clapperboard size={16} /> Trailer
    </Link>
  );
}
