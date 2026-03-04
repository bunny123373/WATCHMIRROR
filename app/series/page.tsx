import type { Metadata } from "next";
import ContentRow from "@/components/common/ContentRow";
import { getAllContent } from "@/lib/content";

export const revalidate = 180;

export const metadata: Metadata = {
  title: "TV Shows"
};

export default async function SeriesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; language?: string; genre?: string; year?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const series = await getAllContent("series");
  const q = (params.q || "").trim().toLowerCase();
  const language = (params.language || "").trim().toLowerCase();
  const genre = (params.genre || "").trim().toLowerCase();
  const year = Number(params.year || 0);
  const sort = params.sort || "latest";

  let filtered = series.filter((item) => {
    const matchesQ = !q || item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    const matchesLanguage = !language || item.language.toLowerCase() === language;
    const matchesGenre = !genre || item.category.toLowerCase() === genre || item.tags.some((tag) => tag.toLowerCase() === genre);
    const matchesYear = !year || item.year === year;
    return matchesQ && matchesLanguage && matchesGenre && matchesYear;
  });

  filtered = filtered.sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "popular") return b.popularity - a.popularity;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const languages = Array.from(new Set(series.map((item) => item.language).filter(Boolean))).sort();
  const genres = Array.from(new Set(series.map((item) => item.category).filter(Boolean))).sort();

  return (
    <div className="space-y-6">
      <h1 className="font-[var(--font-heading)] text-3xl text-white md:text-4xl">TV Shows</h1>
      
      {(language || genre || q) && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
          <span>Showing results:</span>
          {language && <span className="rounded-full bg-white/10 px-3 py-1">{language}</span>}
          {genre && <span className="rounded-full bg-white/10 px-3 py-1">{genre}</span>}
          {q && <span className="rounded-full bg-white/10 px-3 py-1">"{q}"</span>}
          <span className="text-white">({filtered.length})</span>
        </div>
      )}
      
      <ContentRow title={`All TV Shows (${filtered.length})`} items={filtered} />
    </div>
  );
}
